const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./db');
const Room = require('./models/Room');
const ACTIONS = require('./src/Actions');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

const corsOptions = {
    origin: 'https://your-frontend-url.com', // Replace with your frontend URL
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'https://your-frontend-url.com', // Replace with your frontend URL
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true,
    },
});

app.use(express.static('build'));
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const userSocketMap = {};

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, async ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);

        // Retrieve or create the room in the database
        let room = await Room.findOne({ roomId });
        if (!room) {
            room = new Room({ roomId, clients: [{ username, socketId: socket.id }] });
        } else {
            room.clients.push({ username, socketId: socket.id });
        }
        await room.save();

        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });

        // Sync the current code with the joining user
        if (room.code) {
            io.to(socket.id).emit(ACTIONS.SYNC_CODE, {
                code: room.code,
            });
        }
    });

    socket.on(ACTIONS.CODE_CHANGE, async ({ roomId, code }) => {
        // Update the code in the database
        await Room.findOneAndUpdate({ roomId }, { code });

        // Broadcast the code change to all clients in the room
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on('disconnecting', async () => {
        const rooms = [...socket.rooms];
        rooms.forEach(async (roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });

            // Remove the user from the room in the database
            await Room.findOneAndUpdate(
                { roomId },
                { $pull: { clients: { socketId: socket.id } } }
            );
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
