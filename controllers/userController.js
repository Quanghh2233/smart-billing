const db = require('../config/database');
const bcrypt = require('bcrypt');

// Get all users
exports.getUsers = (req, res) => {
    db.all('SELECT id, username, email, role, created_at FROM users', (err, users) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    });
};

// Get single user
exports.getUser = (req, res) => {
    db.get('SELECT id, username, email, role, created_at FROM users WHERE id = ?',
        [req.params.id], (err, user) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Database error',
                    error: err.message
                });
            }

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.status(200).json({
                success: true,
                data: user
            });
        });
};

// Create new user
exports.createUser = async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({
            success: false,
            message: 'Please provide all required fields'
        });
    }

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            `INSERT INTO users (username, email, password, role) 
       VALUES (?, ?, ?, ?)`,
            [username, email, hashedPassword, role],
            function (err) {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Database error',
                        error: err.message
                    });
                }

                res.status(201).json({
                    success: true,
                    data: {
                        id: this.lastID,
                        username,
                        email,
                        role
                    }
                });
            }
        );
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: err.message
        });
    }
};

// Update user
exports.updateUser = (req, res) => {
    const { username, email, role } = req.body;

    if (!username || !email || !role) {
        return res.status(400).json({
            success: false,
            message: 'Please provide all required fields'
        });
    }

    db.run(
        `UPDATE users SET 
     username = ?, 
     email = ?, 
     role = ?,
     updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
        [username, email, role, req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Database error',
                    error: err.message
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'User updated successfully'
            });
        }
    );
};

// Update password
exports.updatePassword = async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a new password'
        });
    }

    try {
        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            `UPDATE users SET 
       password = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
            [hashedPassword, req.params.id],
            function (err) {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Database error',
                        error: err.message
                    });
                }

                if (this.changes === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'User not found'
                    });
                }

                res.status(200).json({
                    success: true,
                    message: 'Password updated successfully'
                });
            }
        );
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error updating password',
            error: err.message
        });
    }
};

// Delete user
exports.deleteUser = (req, res) => {
    db.run('DELETE FROM users WHERE id = ?', [req.params.id], function (err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    });
};
