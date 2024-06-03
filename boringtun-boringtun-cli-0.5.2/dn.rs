//! Replying to DNS challenges
use std::{
    collections::HashMap,
    ops::Deref,
    sync::{Arc, Mutex},
    time::Duration,
};

use async_trait::async_trait;

use tokio::net::{TcpListener, ToSocketAddrs, UdpSocket};
use hickory_proto::{
    error::ProtoError,
    op::{Header, MessageType, ResponseCode},
    rr::{rdata::TXT, DNSClass, Name, RData, Record, RecordType},
};
use hickory_server::{
    authority::MessageResponseBuilder,
    proto::op::LowerQuery,
    server::{Request, RequestHandler, ResponseHandler, ResponseInfo},
    ServerFuture,
};

/// The struct representing the DNS challenges that will be passed around.
///
/// Already contains an Arc<Mutex<...>> to be easy to pass around.
#[derive(Clone, Debug)]
pub struct DnsChallenges {
    /// Associate challenge token(s) to a domain name
    tokens: Arc<Mutex<HashMap<Name, Vec<String>>>>,
}

impl DnsChallenges {
    /// Add a challenge token to the DNS worker
    ///
    /// # Arguments:
    /// - `name`: the domain name being challenged
    /// - `val`: the value of the TXT field for that challenge
    pub fn add_token(&self, name: Name, val: String) {
        tracing::debug!("Adding token {} to name: {}.", &val, &name);
        let mut lock = self.tokens.lock().unwrap();
        lock.entry(name).or_default().push(val);
        for (k, v) in lock.iter() {
            tracing::debug!("{}: {:?}", k, v);
        }
    }

    /// Get all challenge tokens associated with a given domain name
    pub fn get_tokens(&self, name: &Name) -> Vec<String> {
        self.tokens
            .lock()
            .unwrap()
            .get(name)
            .cloned()
            .unwrap_or_default()
    }

    /// Create a new DnsChallenges
    fn new() -> Self {
        Self {
            tokens: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

/// Wrap a DnsChallenges to implement [`DnsRequestHandler`].
///
/// Implementing [`DnsRequestHandler`] tells trust DNS how to use
/// our challenges database to answer DNS requests.
struct DnsRequestHandler {
    challenges: DnsChallenges,
}

#[async_trait]
impl RequestHandler for DnsRequestHandler {
    async fn handle_request<R: ResponseHandler>(
        &self,
        request: &Request,
        mut response_handle: R,
    ) -> ResponseInfo {
        let req_message = request.deref();
        let queries = req_message.query();
        // this is only to allow for early None return
        // Could be replaced with a labeled block since
        // Rust 1.65
        fn process_query(query: &LowerQuery, handle: &DnsChallenges) -> Option<Vec<Record>> {
            match (query.query_class(), query.query_type()) {
                (DNSClass::IN, RecordType::TXT) => (),
                _ => return None,
            }
            let name = query.original().name();
            tracing::debug!("Queried name: {}", &name);
            let mut labels = name.iter();
            // Pop first label ("part between dots") of domain name and
            // expect it to be "_acme-challenge".
            let first_label = labels.next().map(|s| s.to_ascii_lowercase());
            match first_label.as_deref() {
                Some(b"_acme-challenge") => {}
                _ => {
                    tracing::debug!("First label {:?} ignoring.", &first_label);
                    return None;
                }
            }
            let parent_name = Name::from_labels(labels).unwrap();
            let tokens = handle.get_tokens(&parent_name);
            tracing::debug!("For {} tokens are {:?}.", &parent_name, &tokens);
            if tokens.is_empty() {
                None
            } else {
                let mut res = Vec::new();
                for tk in tokens {
                    res.push(Record::from_rdata(
                        name.clone(),
                        1,
                        RData::TXT(TXT::new(vec![tk])),
                    ));
                }
                Some(res)
            }
        }
        let answer_records = process_query(queries, &self.challenges).unwrap_or_default();
        let mut header = Header::new();
        header
            .set_id(req_message.id())
            .set_message_type(MessageType::Response)
            .set_op_code(req_message.op_code())
            .set_authoritative(true)
            .set_truncated(false)
            .set_recursion_available(false)
            .set_recursion_desired(req_message.recursion_desired())
            .set_authentic_data(false)
            .set_checking_disabled(req_message.checking_disabled())
            .set_response_code(ResponseCode::NoError)
            .set_query_count(1)
            .set_answer_count(answer_records.len().try_into().unwrap())
            .set_name_server_count(0)
            .set_additional_count(0);

        let response = MessageResponseBuilder::from_message_request(req_message).build(
            header,
            Box::new(answer_records.iter()) as Box<dyn Iterator<Item = &Record> + Send>,
            Box::new(None.iter()) as Box<dyn Iterator<Item = &Record> + Send>,
            Box::new(None.iter()) as Box<dyn Iterator<Item = &Record> + Send>,
            Box::new(None.iter()) as Box<dyn Iterator<Item = &Record> + Send>,
        );
        response_handle.send_response(response).await.unwrap()
    }
}

/// The top-level struct and entry point of the module.
///
/// Creates all sub structs needed to answer DNS-01 challenges
/// and add domain-name/tokens pairs to our challenge database.
pub struct DnsWorker {
    serv_future: ServerFuture<DnsRequestHandler>,
    challenges: DnsChallenges,
}

impl DnsWorker {
    /// Create a new DnsWorker
    pub async fn new<A: ToSocketAddrs>(listening_addr: A) -> std::io::Result<Self> {
        let challenges = DnsChallenges::new();
        let mut serv_future = ServerFuture::new(DnsRequestHandler {
            challenges: challenges.clone(),
        });
        let udp_socket = UdpSocket::bind(&listening_addr).await?;
        serv_future.register_socket(udp_socket);
        let tcp_listener = TcpListener::bind(&listening_addr).await?;
        serv_future.register_listener(tcp_listener, Duration::from_secs(60));
        Ok(DnsWorker {
            serv_future,
            challenges,
        })
    }

    /// Run the DNS server
    pub async fn run(mut self) -> std::result::Result<(), ProtoError> {
        self.serv_future.block_until_done().await
    }

    /// Get a reference to the dns worker's challenge database.
    pub fn challenges(&self) -> &DnsChallenges {
        &self.challenges
    }
}
