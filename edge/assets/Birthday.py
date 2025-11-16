# Implement a birthday greeting web application using Flask. 
# It includes personalized messages for specific users and a festive HTML interface. 
# For Deploy on PythonAnywhere or Serv00.
from flask import Flask, request, render_template_string, redirect, url_for

app = Flask(__name__)
OWNER = "Arshia"

MESSAGES = {
    "fatemeh": {
        "name": "Fatemeh",
        "message": """Happy Birthday, Fatemeh 🥳

It's been so great getting to know you in our class. You're a wonderful friend. 
I hope you have an amazing day and a fantastic year ahead, full of happiness, health, and success ✨💛"""
    },
    "mohammad_hassan": {
        "name": "Mohammad Hassan",
        "message": """Happy Birthday, Mohammad Hassan 🎉

Man, it's been fun having you in class all this time. You're a great guy. 
Wishing you a very happy birthday and an awesome year. Hope it's filled with good times and new achievements.
        
Cheers 🤍🍻"""
    }
}

LOGIN_HTML = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>A Message For You</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Poppins', sans-serif;
      display: flex;
      min-height: 100vh;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 25%, #ff9a9e 50%, #fad0c4 75%, #ffd1ff 100%);
      background-size: 400% 400%;
      animation: gradientShift 15s ease infinite;
      color: #fff;
      position: relative;
      overflow: hidden;
      padding: 16px;
    }
    @keyframes gradientShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    .confetti { position: absolute; width: 12px; height: 12px; background: #f0f; opacity: 0.8; animation: fall linear infinite; top: 0; pointer-events: none; }
    @keyframes fall { 
    from { transform: translateY(0) rotate(0deg); }
    to { transform: translateY(100vh) rotate(720deg); } 
    }
    .card {
      width: 100%;
      max-width: 400px;
      background: rgba(255, 255, 255, 0.95);
      padding: 32px 24px;
      border-radius: 20px;
      box-shadow: 0 15px 40px rgba(0,0,0,0.2);
      backdrop-filter: blur(20px);
      border: 2px solid rgba(255,255,255,0.3);
    }
    @keyframes fadeInUp { 
      from { opacity: 0; transform: translateY(40px) scale(0.95); } 
      to { opacity: 1; transform: translateY(0) scale(1); } 
    }
    h1 {
      margin: 0 0 10px;
      font-size: 26px;
      font-weight: 700;
      background: linear-gradient(135deg, #ff9a9e, #fad0c4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-align: center;
    }
    p {
      margin: 0 0 20px;
      line-height: 1.5;
      color: #555;
      text-align: center;
      font-size: 14px;
    }
    label {
      display: block;
      margin-top: 8px;
      font-size: 13px;
      color: #666;
      font-weight: 600;
    }
    input[type=text] {
      width: 100%;
      padding: 12px 14px;
      border-radius: 12px;
      border: 2px solid #e0e0e0;
      background: #fff;
      color: #333;
      font-size: 15px;
      font-family: 'Poppins', sans-serif;
      transition: all 0.3s;
    }
    input[type=text]:focus {
      outline: none;
      border-color: #ff9a9e;
      box-shadow: 0 0 0 4px rgba(255, 154, 158, 0.1);
    }
    .btn {
      display: block;
      width: 100%;
      margin-top: 16px;
      padding: 13px;
      border-radius: 12px;
      border: 0;
      background: linear-gradient(135deg, #ff9a9e, #fad0c4);
      color: white;
      cursor: pointer;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s;
      font-family: 'Poppins', sans-serif;
      box-shadow: 0 4px 15px rgba(255, 154, 158, 0.4);
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 154, 158, 0.6);
    }
    .btn:active {
      transform: translateY(0);
    }
    .error {
      color: #e74c3c;
      margin-top: 14px;
      font-size: 13px;
      text-align: center;
      font-weight: 500;
    }
    .emoji { font-size: 42px; text-align: center; margin-bottom: 14px; animation: bounce 2s infinite; }
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="emoji">🎁</div>
    <h1>Hello dear</h1>
    <p>This is a small birthday surprise prepared by {{ owner }}. Please enter your first-name to continue.</p>
    <form method="post" action="/greet">
      <label for="name">Your name:</label>
      <input id="name" name="name" type="text" autocomplete="off" required>
      <button class="btn" type="submit">Open Your Gift 🎉</button>
    </form>
    {% if error %}
      <div class="error">{{ error }}</div>
    {% endif %}
  </div>
  <script>
    for(let i=0;i<70;i++){
      const c=document.createElement('div');
      c.className='confetti';
      c.style.left=Math.random()*100+'%';
      c.style.top = Math.random() * -20 + 'px';
      c.style.background=['#ff6b6b','#4ecdc4','#ffe66d','#a8e6cf','#ffd3b6'][Math.floor(Math.random()*5)];
      c.style.animationDuration=(Math.random()*4+3)+'s';
      c.style.animationDelay=Math.random()*3+'s';
      document.body.appendChild(c);
    }
  </script>
</body>
</html>
"""

GREET_HTML = """
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Happy Birthday</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Poppins', sans-serif;
    background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 25%, #ff9a9e 50%, #fad0c4 75%, #ffd1ff 100%);
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 16px;
    position: relative;
    overflow-x: hidden;
  }
  @keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  .balloon { position: absolute; font-size: 2.5rem; animation: float 6s ease-in-out infinite; }
  @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-30px) rotate(10deg); } }
  .box {
    width: 100%;
    max-width: 480px;
    padding: 28px 20px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 15px 40px rgba(0,0,0,0.2);
    animation: fadeInUp 0.8s ease-out;
    backdrop-filter: blur(20px);
    border: 2px solid rgba(255,255,255,0.3);
  }
  @keyframes fadeInUp { 
    from { opacity: 0; transform: translateY(40px) scale(0.95); } 
    to { opacity: 1; transform: translateY(0) scale(1); } 
  }
  h2 {
    margin: 0 0 8px;
    font-size: 26px;
    font-weight: 700;
    background: linear-gradient(135deg, #ff9a9e, #fad0c4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-align: center;
  }
  p {
    margin: 0 0 16px;
    line-height: 1.5;
    color: #555;
    text-align: center;
    font-size: 14px;
  }
  .message-block {
    white-space: pre-wrap;
    font-family: 'Poppins', sans-serif;
    background: linear-gradient(135deg, rgba(255,154,158,0.1), rgba(250,208,196,0.1));
    padding: 18px;
    border-radius: 14px;
    font-size: 14px;
    line-height: 1.7;
    color: #333;
    border: 2px solid rgba(255,154,158,0.2);
    min-height: 120px;
  }
  .cake-area {
    text-align: center;
    margin: 20px 0 16px;
  }
  .cake { font-size: 5rem; animation: cakeBounce 2s infinite; }
  @keyframes cakeBounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  .candles {
    font-size: 2.8rem;
    letter-spacing: 6px;
    margin-top: -20px;
    animation: flicker 1.5s infinite alternate;
  }
  @keyframes flicker { 0% { opacity: 1; } 100% { opacity: 0.8; } }
  .action {
    margin-top: 20px;
    text-align: center;
  }
  .btn {
    display: inline-block;
    padding: 13px 24px;
    border-radius: 14px;
    border: 0;
    background: linear-gradient(135deg, #ff9a9e, #fad0c4);
    color: white;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s;
    font-family: 'Poppins', sans-serif;
    box-shadow: 0 6px 20px rgba(255, 154, 158, 0.4);
  }
  .btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(255, 154, 158, 0.6);
  }
  .btn:active {
    transform: translateY(0);
  }
</style>
</head>
<body>
  <div class="balloon" style="top:10%;left:5%;animation-delay:1s;">🎈</div>
  <div class="balloon" style="top:20%;right:8%;animation-delay:2s;">🎈</div>
  <div class="balloon" style="bottom:15%;left:10%;animation-delay:1.5s;">🎈</div>
  <div class="balloon" style="bottom:25%;right:5%;animation-delay:2s;">🎈</div>
  
  <div class="box">
    <h2>Happy Birthday, {{ name }}</h2>
    <p>A special message from {{ owner }}:</p>
    <div id="message-block" class="message-block"></div>
    
    <div class="cake-area">
      <div class="candles">🕯️🕯️🕯️</div>
      <div class="cake">🎂</div>
    </div>
    
    <div class="action">
      <a href="{{ url_for('finale', name=name) }}" class="btn">Make a wish and blow out the candles</a>
    </div>
  </div>
  
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const message = `{{ message }}`;
      const messageBlock = document.getElementById('message-block');
      let i = 0;
      function typeWriter() {
        if (i < message.length) {
          messageBlock.innerHTML += message.charAt(i);
          i++;
          setTimeout(typeWriter, 40);
        }
      }
      typeWriter();
    });
  </script>
</body>
</html>
"""

FINAL_HTML = """
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wishes</title>
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Poppins', sans-serif;
    background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 25%, #ff9a9e 50%, #fad0c4 75%, #ffd1ff 100%);
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    text-align: center;
    padding: 16px;
  }
  @keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  .wrap {
    width: 100%;
    max-width: 480px;
    padding: 36px 28px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 15px 40px rgba(0,0,0,0.2);
    animation: fadeInScale 1s ease-out;
    backdrop-filter: blur(20px);
    border: 2px solid rgba(255,255,255,0.3);
  }
  @keyframes fadeInScale { 
    from { opacity: 0; transform: scale(0.8) rotate(-5deg); } 
    to { opacity: 1; transform: scale(1) rotate(0deg); } 
  }
  h1 {
    margin: 0 0 10px;
    font-size: 30px;
    font-weight: 700;
    background: linear-gradient(135deg, #ff9a9e, #fad0c4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: titlePulse 2s infinite;
  }
  @keyframes titlePulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  p {
    margin: 0 0 16px;
    font-size: 17px;
    color: #555;
    font-weight: 500;
  }
  .cake {
    font-size: 6rem;
    margin-top: 16px;
    animation: cakeSpin 3s ease-in-out infinite;
  }
  @keyframes cakeSpin { 
    0%, 100% { transform: rotate(0deg) scale(1); } 
    25% { transform: rotate(-10deg) scale(1.1); }
    75% { transform: rotate(10deg) scale(1.1); }
  }
</style>
</head>
<body>
  <div class="wrap">
    <h1>Happy Birthday {{ name }} 🎉</h1>
    <p>Congratulations on surviving another trip around the sun without being abducted by aliens 👽👾👻<br><br></p>
    <p>All the best wishes from <b>{{ owner }}</b> 🤍</p>
    <div class="cake">🎂</div>
  </div>
  
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      function shootConfetti() {
        confetti({
          particleCount: 200,
          spread: 120,
          origin: { y: 0.5 },
          colors: ['#ff9a9e', '#fad0c4', '#ffecd2', '#fcb69f', '#ffd1ff', '#ff6b6b', '#ffe66d']
        });
      }
      
      shootConfetti();
      setTimeout(shootConfetti, 400);
      setTimeout(shootConfetti, 800);
      
      setInterval(function() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ff9a9e', '#fad0c4', '#ffecd2']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#fcb69f', '#ffd1ff', '#ff6b6b']
        });
      }, 250);
    });
  </script>
</body>
</html>
"""

@app.route('/', methods=['GET'])
def index():
    error = request.args.get('error')
    return render_template_string(LOGIN_HTML, owner=OWNER, error=error)

@app.route('/greet', methods=['POST'])
def greet():
    name = (request.form.get('name') or '').strip()
    normalized_name = name.lower()

    person_key = None

    if normalized_name in ['fatemeh', 'فاطمه', 'فاطی', 'fati', 'fatima']:
        person_key = 'fatemeh'
    elif normalized_name in ['mohammad hassan', 'محمد حسن', 'ممد', 'mmd hsn', 'mohamad', 'mmd']:
        person_key = 'mohammad_hassan'
        
    if person_key:
        person_data = MESSAGES[person_key]
        return render_template_string(
            GREET_HTML, 
            name=person_data['name'], 
            message=person_data['message'], 
            owner=OWNER
        )
    else:
        error_msg = "This page isn't for you 😏🤔"
        return redirect(url_for('index', error=error_msg))

@app.route('/finale')
def finale():
    name = request.args.get('name', 'Friend')
    return render_template_string(FINAL_HTML, name=name, owner=OWNER)

if __name__ == '__main__':
    # This block is for LOCAL TESTING only.
    # PythonAnywhere and Serv00 will IGNORE this.
    app.run(host='0.0.0.0', port=8000, debug=True)
