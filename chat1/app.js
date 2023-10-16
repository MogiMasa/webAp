var vm = new Vue({
    el: '#app',
    data: {
        data: null,
        prompt: null, //gptに送る文章
        message: null, //gptから返ってきた文章
        APIkey: null,
    },
    methods: {
        getRequest: async function() {
            const requestOptions = {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + String(this.APIkey)
                },
                body: JSON.stringify({
                  'model': 'gpt-3.5-turbo',
                  'messages': [
                    {
                        'role': 'system',
                        'content': this.prompt,
                    }
                  ]
                })
            };
            
            fetch('https://api.openai.com/v1/chat/completions', requestOptions)
                .then(response => response.json())
                .then(data => {
                console.log("Success:", data);
                this.message = data.choices[0].message.content;
                console.log("Message:", this.message);
            }).catch(err => {
                console.log("Ran out of tokens for today! Try tomorrow!");
            });
        
        },

        setLocalStorage: function() {
            console.log(this.APIkey);
            localStorage.setItem('APIkey', this.APIkey);
        }

    },

    mounted: function() {
        this.APIkey = localStorage.getItem('APIkey');
    }
})
