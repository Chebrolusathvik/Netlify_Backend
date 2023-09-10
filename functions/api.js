const serverless = require('serverless-http');



const dialogflow = require('@google-cloud/dialogflow')
const {WebhookClient} = require('dialogflow-fulfillment')
const express = require("express")
//const twilio = require("twilio")
const axios = require("axios")
const bodyParser = require("body-parser");
const cors = require("cors");

var sessionClient = new dialogflow.SessionsClient();
const { Configuration, OpenAIApi} = require('openai');
require('dotenv').config();
const router = express.Router();

const configuration = new Configuration({
    
     apiKey: process.env.OPENAI_API_KEY,
    
})

console.log(configuration.apiKey);

// const MAX_RETRIES = 3;
// const INITIAL_DELAY_MS = 3000; 
const openai = new OpenAIApi(configuration);
const textGeneration = async (prompt) => {
    try{
        // await new Promise(resolve => setTimeout(resolve, 1000));
        // const delay = Math.pow(2, retries) * INITIAL_DELAY_MS;
        // await new Promise(resolve => setTimeout(resolve, delay))
        const payload = {
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'user', content: `${prompt} + give response in precise way in 20-30 words` }
            ],
            temperature: 0.7,
            max_tokens: 266,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            stop:['\n']
          };

        const response = await axios.post('https://api.openai.com/v1/chat/completions',payload,{
          
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${configuration.apiKey}`
              },
           
        });
        console.log(response);
        // const response = await openai.createCompletion({
        //     model: "gpt-3.5-turbo",
        //     messages: [
        //       {
        //         "role": "user",
        //         "content": prompt
        //       }
        //     ],
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer` + `${configuration.apiKey}`
        //     },
        //     temperature: 0.7,
        //     max_tokens: 500,
        //     top_p: 1,
        //     frequency_penalty: 0,
        //     presence_penalty: 0,
        //     stop: ["Human:", "AI:"],
            // model: 'text-davinci-003',
            // prompt: `Human: ${prompt}\nAI: `,
            // headers: {
            //          'Content-Type': 'application/json',
            //         'Authorization': `Bearer ${configuration.apiKey}`
            //     },
            // temperature: 0.9,
            // max_tokens: 1000,
            // top_p: 1,
            // frequency_penalty: 0,
            // presence_penalty: 0.6,
            // stop: ['Human:', 'AI:']
         // });
        //   console.log(response.data.choices[0].message.content);
          return {
            status:1,
            response: `${response.data.choices[0].message.content}`
            //response: `${response.data.choices[0].text}`
          };
        }catch (error) {
           
              
                return {
                    status: 0,
                    response: ''
                };
            }
        
}



const webApp = express();
const PORT = process.env.PORT || 3000;
webApp.use(express.urlencoded({
    extended: true
}));

webApp.use(
    bodyParser.json({
      limit: "250mb",
    }),
),
webApp.use(
    bodyParser.urlencoded({
      limit: "250mb",
      extended: true,
      parameterLimit: 250000,
    }),
),
webApp.use(express.json());
webApp.use(cors());
// webApp.use((req,res, next) => {
//     console.log(`Path ${req.path} with Method ${req.method} `);
//     next();
// });

router.get('/', (req,res) => {
    res.sendStatus(200);
    res.send("Status Okay");
});

router.post('/dialogflow',async (req,res) => {
    // var id = (res.req.body.session).substr(43);
    // console.log(id);
    // const agent = new WebhookClient({
    //     request: req,
    //     response: res
    // });
    let action = req.body.queryResult.action;
    let queryText = req.body.queryResult.queryText;

    if (action == 'input.unknown') {
        let result = await textGeneration(queryText);
        console.log(result);
        if (result.status == 1){
            res.send({
                fulfillmentText: result.response
            })
        }
     else {
        fulfillmentText: `sorry`
    }
}
    // async function fallback() {
    //     let action = req.body.queryResult.action;
    //     let queryText = req.body.queryResult.queryText;

    //     if (action == 'input.unknown') {
    //         let result = await textGeneration(queryText);
    //         console.log(result);
    //         if (result.status == 1){
    //             agent.add(result.response);
    //         }
    //      else {
    //        agent.add("Hey Sorry!")
    //     }
    // }
   // } 

    // function hi(agent) {
    //     console.log('intent -> hi');
    //     agent.add("Hi, how can i assist");
    // }
    // let intentMap = new Map();
    // intentMap.set('Default Welcome Intent', hi);
    // intentMap.set('Default Fallback Intent', fallback);
    // agent.handleRequest(intentMap);
});

// webApp.post('/dialogflow', async (req, res) => {
    
//     let action = req.body.queryResult.action;
//     let queryText = req.body.queryResult.queryText;

//     if (action === 'input.unknown') {
//         let result = await textGeneration(queryText);
//         console.log(result);
//         if (result.status == 1) {
//             res.send(
//                 {
//                     fulfillmentText: result.response
//                 }
//             );
//         } else {
//             res.send(
//                 {
//                     fulfillmentText: `Sorry, I'm not able to help with that.`
//                 }
//             );
//         }
//     } else {
//         res.send(
//             {
//                 fulfillmentText: `No handler for the action ${action}.`
//             }
//         );
//     }
// });

webApp.use('/', router);

// webApp.listen(PORT, () => {
//     console.log(`server is running at http://localhost:${PORT}/`);
// })


module.exports.handler = serverless(webApp);