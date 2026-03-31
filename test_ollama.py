import ollama

client = ollama.Client(host='http://localhost:11434')
response = client.chat(model='llama3:latest', messages=[{'role': 'user', 'content': 'hi'}])
print(type(response))
print(response)

# print what attributes/keys it has
if isinstance(response, dict):
    print("Is dict")
else:
    print("Is object, attributes:", dir(response))
