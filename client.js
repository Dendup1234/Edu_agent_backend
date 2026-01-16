import {io} from "socket.io-client";

const user1Id = '696397cff72a315772c30f3f';
const user2Id = '6963990f1ae3adf960b745dd';

// Create User 1 client
const user1 = io('http://localhost:8000'); // Adjust your server URL

user1.on('connect', () => {
  console.log('User 1 connected:', user1.id);
  
  // Join room
  user1.emit('user_connected', user1Id);
  
  // After joining, send a message
  setTimeout(() => {
    console.log('\nUser 1 sending message to User 2');
    user1.emit('send_message', {
      sender: user1Id,
      receiver: user2Id,
      content: "Hello from User 1!",
      senderModel: 'Student',
      receiverModel: 'Student'
    });
  }, 1000);
});

user1.on('connected', (data) => {
  console.log('User 1 joined room:', data.userId);
});

user1.on('sent_message', (data) => {
  console.log('User 1: Message sent successfully');
  console.log('Response:', data.message);
});

user1.on('receive_message', (data) => {
  console.log('User 1: Received new message');
  console.log('From:', data.message.sender);
  console.log('Content:', data.message.content);
});

user1.on('error', (error) => {
  console.error('User 1 error:', error);
});

// Create User 2 client
const user2 = io('http://localhost:8000');

user2.on('connect', () => {
  console.log('\nUser 2 connected:', user2.id);
  
  // Join room
  user2.emit('user_connected', user2Id);
  
  // Respond after 3 seconds
  setTimeout(() => {
    console.log('\nUser 2 sending reply to User 1');
    user2.emit('send_message', {
      sender: user2Id,
      receiver: user1Id,
      content: "Hi back from User 2!",
      senderModel: 'Student',
      receiverModel: 'Student'
    });
  }, 3000);
});

user2.on('connected', (data) => {
  console.log('User 2 joined room:', data.userId);
});

user2.on('receive_message', (data) => {
  console.log('\nUser 2: Received first message');
  console.log('From:', data.message.sender);
  console.log('Content:', data.message.content);
  console.log('Conversation ID:', data.message.conversationId);
});

user2.on('sent_message', (data) => {
  console.log('User 2: Reply sent');
  console.log('Response:', data.message);
});

// Handle disconnection
process.on('SIGINT', () => {
  console.log('\nDisconnecting...');
  user1.disconnect();
  user2.disconnect();
  process.exit();
});