/**
 * Global config settings for cms
 */


exports.global = {

    mode: 'development',
    secureKey: 'hfvtyfiuhrtdt76rtyc5',
    upload_dir: './uploads/',
    logger: {
        file: {
            level: 'silly',
            file: 'jxcms.log'
        },
        console: {
            level: 'silly'
        }
    }

};
