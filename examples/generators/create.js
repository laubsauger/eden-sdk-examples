import eden from '../../init_eden.js'

const config = {
  text_input: "Garden of Eden"
}

const input = {
  generatorName: "create",
  config
}

const result = await eden.create(input);

console.log(result)