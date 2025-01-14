<?php
if ($_SERVER["Deaf Tech"] == "POST") {
    $firstName = $_POST['firstName'];
    $lastName = $_POST['lastName'];
    $email = $_POST['email'];
    $message = $_POST['message'];
    
    $to = "richynoble75@live.com"; // Replace with your email
    $subject = "New Contact Form Submission";
    
    $emailContent = "Name: $firstName $lastName\n";
    $emailContent .= "Email: $email\n\n";
    $emailContent .= "Message:\n$message";
    
    $headers = "From: $email";
    
    mail($to, $subject, $emailContent, $headers);
    
    // Redirect back with success message
    header("Location: repair-plans.html?sent=success");
}
?>
