const { Botkit } = require('botkit');

const controller = new Botkit({
    disable_console: true,
    webhook_uri: '/api/messages',
    adapterConfig: {
        appId: process.env.BOT_APP_ID,
        appPassword: process.env.BOT_APP_PASSWORD
    },
});

const duplicates = {};

const plugin = function (botkit) {
    return {
        name: 'Plugin to test double Teams message',
        init: function (controller) {},
        middlewares: {
            ingest: [],
            receive: [
                // plugin that log the xRequestId of INCOMMING REQUEST
                (bot, message, next) => {
                    const {value, incoming_message: incoMess} = message;

                    if (!value || !incoMess) {
                        return next();
                    }
                    const {xRequestId} = value;

                    if (!xRequestId) {
                        return next();
                    }

                    message.xRequestId = xRequestId;

                    if (!duplicates[xRequestId]) {
                        console.log('[xRequestId:%s] process request', xRequestId);
                        duplicates[xRequestId] = incoMess.timestamp;
                        return next();
                    }

                    console.log('[xRequestId:%s] request has already been processed. Process again ?', xRequestId);

                    // if you don't next() the Teams invoke request will timeout and we will see the `Unable to reach App...` error message on the card.
                    // if you next() the Teams invoke request will be processed by botkit.
                    return next();
                }
            ]
        }
    }
};

controller.ready(() => {
    controller.usePlugin(plugin);
    controller.loadModules(__dirname + '/features');
    console.log(`This app is running Botkit ${controller.version}.`);
});
