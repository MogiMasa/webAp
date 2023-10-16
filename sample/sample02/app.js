var vm = new Vue({
    el: '#app',
    data: {
        title: '',
        todo: [
            {title: '部屋を掃除する', done: false},
            {title: '郵便物を受け取る', done: false},
        ]
    },
    methods: {
        // ToDo項目の追加。
        add: function() {
            if (this.title == '') {
                alert('Error: ToDoが入力されていません。');
                return;
            }
            this.todo.push({title: this.title, done: false});
            this.title = '';
        },
        // ToDo項目の削除。
        remove: function(index) {
            this.todo.splice(index, 1);
        }
    }
})
