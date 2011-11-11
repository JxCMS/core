

exports.config = {
    db: 'test',
    host: 'localhost',
    port: 27017,
    server_options: {
        auto_reconnect: true
    },
    db_options: {
        native_parser: false,
        strict: false
    }
};