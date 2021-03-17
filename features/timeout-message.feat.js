const {BotkitConversation} = require('botkit');
const {v4: uuidv4} = require('uuid');

const DIALOG_ID = 'DIALOG_ID';

module.exports = (controller) => {

    // simulate conversation
    const botkitConversation = new BotkitConversation(DIALOG_ID, controller);
    botkitConversation.addQuestion(
        {
            attachments: (template, vars) => {
                const xRequestId = uuidv4();
                console.log('Message detected, generate action with xRequestId : %s ', xRequestId);
                return [{
                    contentType: 'application/vnd.microsoft.card.hero',
                    content: {
                        title: 'What you want to do for this test ?',
                        text: 'The action button simulates a long time API calls. ' +
                            'The payload of this action will be sent two times by Teams.',
                        buttons: [
                            {
                                type: 'messageBack',
                                title: 'Action',
                                displayText: 'Action',
                                value: {
                                    xRequestId: xRequestId
                                },
                                text: 'action_payload'
                            },
                        ]
                    }
                }];
            }
        },
        async (answer, convo, bot, message) => {
            const {xRequestId} = message;
            convo.setVar('xRequestId', xRequestId);
            let reply = `[xRequestId:${xRequestId}] user payload answer : ${answer}`;

            console.log('[xRequestId:%s] REPLY - %s', xRequestId, reply);
            await bot.reply(message, reply);

            reply = `[xRequestId:${xRequestId}] API simulate - 18s wait.`;
            console.log(reply);
            await bot.reply(message, reply);

            return await convo.gotoThread('thread_api');
        },
        '',
        'default'
    );

    // simulate a long time call to an API
    botkitConversation.before('thread_api', async (convo, bot) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('[xRequestId:%s] API simulate ending call - go to next thread', convo.vars.xRequestId);
                resolve();
            }, 18000);
        });
    });

    // message triggers when the API call ends
    botkitConversation.addMessage({
        text: (template, vars) => {
            const reply = `[xRequestId:${vars.xRequestId}] simulating API calls ends`;
            console.log('[xRequestId:%s] REPLY - %s', vars.xRequestId, reply);
            return reply;
        }
    }, 'thread_api');

    // add dialog to controller
    controller.addDialog(botkitConversation);

    // type `doubleMessage` to trigger the test
    controller.hears('.*', 'message', async (bot, message) => {
        await bot.beginDialog(DIALOG_ID);
    });
};