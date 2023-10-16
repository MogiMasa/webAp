var vm = new Vue({
    el: '#app',
    data: {
        data: null
    },
    methods: {
        getRequest: async function() {
            try {
                const response = await axios.get('https://jsonplaceholder.typicode.com/posts/1');
                this.data = response.data;
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
    }
})
