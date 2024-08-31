const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true,
    },
    clients: [
        {
            username: {
                type: String,
                required: true,
            },
            socketId: {
                type: String,
                required: true,
            },
        },
    ],
    code: {
        type: String,
        default: '', // Store the code content here
    },
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
