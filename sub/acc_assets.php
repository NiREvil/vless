<?php
include "config.php";

$channel_array = [];

foreach ($Types as $channel => $data_array) {
    // Fetch the HTML content of the Telegram channel page
    $html = file_get_contents("https://t.me/s/" . $channel);
    
    // Extract the title and image URL using regular expressions
    $title_pattern = '#<meta property="twitter:title" content="(.*?)">#';
    $image_pattern = '#<meta property="twitter:image" content="(.*?)">#';
    preg_match($image_pattern, $html , $image_match);
    preg_match($title_pattern, $html , $title_match);
    
    // Save the image file to local storage
    file_put_contents("modules/channels/" . $channel . ".jpg", file_get_contents($image_match[1]));
    
    // Build the channel data array
    $channel_array[$channel]['types'] = $data_array;
    $channel_array[$channel]['title'] = $title_match[1];
    $channel_array[$channel]['logo'] = "https://raw.githubusercontent.com/" . $channel . ".jpg";
}
// Save the channel data array as JSON
file_put_contents("modules/channels/channels_assets.json", json_encode($channel_array , JSON_PRETTY_PRINT));
