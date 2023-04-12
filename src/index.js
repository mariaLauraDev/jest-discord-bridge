const stripAnsi = require('strip-ansi');
const DiscordWebhook = require('discord-webhook-node');

class DiscordReporter {
    constructor(globalConfig, reporterOptions, reporterContext) {
        this._globalConfig = globalConfig;
        this._context = reporterContext;
        this._timeZone = reporterOptions.timeZone || 'America/New_York';
        this._reportIfSuccess = reporterOptions.reportIfSuccess || false;
        
        if (!reporterOptions.webhook) {
            throw new Error('\nPlease set a discord webhook for jest-discord-bridge in jest.config.js');
        }
        
        this._discordOptions = {
            webhook: reporterOptions.webhook,
            userName: reporterOptions.userName || 'Jest Reporter',
            avatar: reporterOptions.avatarUrl || 'https://jestjs.io/pt-BR/img/opengraph.png',
        };
        
        this.webhook = new DiscordWebhook.Webhook(this._discordOptions.webhook);
        this.webhook.setUsername(this._discordOptions.userName);
        this.webhook.setAvatar(this._discordOptions.avatar);
    }

    onRunComplete(test, runResults) {
        let date = new Date();
        let testDateTime = date.toLocaleString('en-US', {timeZone: this._timeZone});

        // collect failure messages
        const failureMessages = runResults.testResults.reduce((acc, { failureMessage }) => {
            if (failureMessage) {
                acc.push(stripAnsi(failureMessage));
            }

            return acc;
        }, []);

        try {
            if (failureMessages.length) {
                if(failureMessages.join('\n').length <= 2000) {
                    this.webhook.send(`**SITE ALERT**: Test date and time: ${testDateTime}\n ${failureMessages.join('\n')}`);
                } else {
                    this.webhook.send(`**SITE ALERT**: Test date and time: ${testDateTime}\nTotal tests failed: ${runResults.testResults[0].numFailingTests}\nThe error message is too big to send via discord`);
                }
            } else if (this._reportIfSuccess) {
                this.webhook.send(`**SITE STATUS**: Test date and time: ${testDateTime}\n All tests passed!`);
            }
        } catch (error) {
            this.webhook.send(`**SITE ALERT**: Test date and time: ${testDateTime}\nAn unknown error occurs`);
        } 
    }
}

module.exports = DiscordReporter;
