const SEND_DATA_URI = 'http://localhost:8080/mineBlock';
const DATE_TEMPLATE = 'Surveillance Cam Site #3';
const Images = {
    0: 'none.jpg', 1: 'television.jpg', 2: 'aircondictioner.jpg',
    3: 'television-aircondictioner.jpg', 4: 'light.jpg', 5: 'television-light.jpg', 6: 'aircondictioner-light.jpg',
    7: 'all.jpg'
};

const MessageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2
};

class CanvasController {

    updateTime() {
        this.timer.innerHTML = `${DATE_TEMPLATE} - ${new Date()}`;
    }

    constructor() {
        this.timer = document.getElementById('timer');
        this.mainDiv = document.getElementById('mainDiv');
        this.mainCanvas = document.getElementById('mainCanvas');
        this.lightButton = document.getElementById('light-button');
        this.acButton = document.getElementById('ac-button');
        this.tvButton = document.getElementById('tv-button');
        this.data = undefined;

        this.updateTime();
        setInterval(this.updateTime, 1000);

        this.lightButton.onclick = () => {
            this.sendData(SEND_DATA_URI, {
                light: !this.data.light,
                television: this.data.television,
                aircondictioner: this.data.aircondictioner,
            });
        }

        this.tvButton.onclick = () => {
            this.sendData(SEND_DATA_URI, {
                light: this.data.light,
                television: !this.data.television,
                aircondictioner: this.data.aircondictioner,
            });
        }

        this.acButton.onclick = () => {
            this.sendData(SEND_DATA_URI, {
                light: this.data.light,
                television: this.data.television,
                aircondictioner: !this.data.aircondictioner,
            });
        }

    }

    sendData(uri, data) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", uri, true);

        //Send the proper header information along with the request
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onreadystatechange = function () {//Call a function when the state changes.
            if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
                console.log('Data has been sent');
            }
        }

        xhr.send(JSON.stringify({ data: data }));
    }

    handleResponse(response) {
        console.log('Handling response:', response);
        if ((this.data = response.data) !== undefined) {

            this.lightButton.className = this.data.light ? 'on' : 'off';
            this.acButton.className = this.data.aircondictioner ? 'on' : 'off';
            this.tvButton.className = this.data.television ? 'on' : 'off';


            let index = (this.data.television || 0) + (this.data.aircondictioner || 0) * 2 + (this.data.light || 0) * 4;
            console.log('Index: ', index);
            this.mainCanvas.setAttribute('src', `./file?source=gfx/${Images[index]}`);
        }

        console.log('Cur Data: ', this.data);
    }

}

class SocketFactory {

    constructor() {
        this.controller = new CanvasController();
        this.ws = undefined;
    }

    parseResponse(resp) {
        let outter = JSON.parse(resp);
        if (outter.data) { outter.data = JSON.parse(outter.data); }
        return outter;
    }

    start() {

        if ("WebSocket" in window) {
            this.ws = new WebSocket("ws://localhost:6001");

            this.ws.onopen = () => {
                this.ws.send(JSON.stringify({ 'type': MessageType.QUERY_ALL }));
            };

            this.ws.onmessage = (evt) => {
                var received_msg = evt.data;
                console.log(received_msg);
                let message = this.parseResponse(received_msg);

                if (message.type === MessageType.RESPONSE_BLOCKCHAIN) {
                    this.controller.handleResponse(message.data[message.data.length - 1]);
                }
            };

            this.ws.onclose = () => {
                console.log('Connection Closed');
            };

        } else {
            alert("WebSocket NOT supported by your Browser!");
        }
    }
}

const factory = new SocketFactory();
factory.start();