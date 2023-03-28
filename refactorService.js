import { Configuration, OpenAIApi } from "openai"
import CliState from "./cliState.js";
import ConfigService from "./configService.js"

export default class RefactorService {
  static async call(prompt) {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    })
    const verbose = CliState.opts().verbose
    const openai = new OpenAIApi(configuration)
    
    const config = await ConfigService.retrieveConfig();
    const promptLength = Math.ceil((prompt.split(" ").length + prompt.split("\t").length + prompt.split("\n").length) * 1.25)
    const apiConfig = {
      ...config.api,
      prompt: prompt,
      max_tokens: (config.settings.maxTokens - promptLength),
    }
    if (verbose) console.log(`apiConfig: ${JSON.stringify(apiConfig)}`)    
    //const response = await openai.createCompletion(apiConfig)

    const response = await openai.createChatCompletion({
      model: "gpt-4",
      temperature: config.api.temperature,
      messages: [{role: "user", content: prompt }],
    });

    if (!response?.data?.choices) return null
    let result = response.data.choices.map((d) => d?.message?.content?.trim()).join()
    if (verbose) console.log(`Response: \n${result}`)
    const output = this.extractSourceCode(result)
    return output
  }

  static extractSourceCode(input) {
    const lines = input.split("\n")
    if (lines.length > 0 && lines[0].startsWith("Updated source code:")) {
      lines.shift()
    }
    if (lines.length > 0 && lines[0].startsWith("// Your code")) {
      lines.shift()
    }
    if (lines.length > 0 && lines[0].startsWith("-------")) {
      lines.shift()
    }
    return lines.join("\n")
  }

  static async getPreamble(preamblePath) {
    try {
      // Use the fs module to read the file
      const preamble = await fs.promises.readFile(preamblePath, "utf-8")
      return preamble
    } catch (err) {
      this.log(err)
    }
  }

  static log(message) {
    console.log(message)
  }

}