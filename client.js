import {io} from "socket.io-client"

// Use actual ObjectIds from your database
const user1Id = '696397cff72a315772c30f3f'; // First student ID
const user2Id = '6963990f1ae3adf960b745dd'; // Second student ID

// Create two clients
const user1 = io('http://localhost:8000');
const user2 = io('http://localhost:8000');

// User 1 setup
user1.on('connect', () => {
    console.log('Student 1 connected');
    user1.emit('user_connected', user1Id);
});

user1.on('new_message', (data) => {
    console.log('📨 Student 1 received:', data.message.content);
    console.log('From:', data.message.sender);
});

user1.on('message_sent', (data) => {
    console.log('Student 1: Message sent successfully');
    console.log('Conversation ID:', data.conversationId);
});

user1.on('error', (error) => {
    console.log('Student 1 error:', error);
});

// User 2 setup
user2.on('connect', () => {
    console.log('Student 2 connected');
    user2.emit('user_connected', user2Id);
});

user2.on('new_message', (data) => {
    console.log('📨 Student 2 received:', data.message.content);
    console.log('From:', data.message.sender);
});

user2.on('error', (error) => {
    console.log('Student 2 error:', error);
});

// Start chatting after both connect
setTimeout(() => {
    console.log('\n--- Starting chat test ---\n');
    
    // Student 1 sends to Student 2
    console.log('Student 1 → Student 2: Hello!');
    user1.emit('send_message', {
        sender: user1Id,
        receiver: user2Id,
        content: 'Hello from Student 1!',
        senderModel: 'Student',
        receiverModel: 'Student'
    });
    
    // Student 2 replies after 2 seconds
    setTimeout(() => {
        console.log('\nStudent 2 → Student 1: Hi there!');
        user2.emit('send_message', {
            sender: user2Id,
            receiver: user1Id,
            content: 'Hello back from Student 2!',
            senderModel: 'Student',
            receiverModel: 'Student'
        });
    }, 2000);
}, 1000);

process.stdin.resume();