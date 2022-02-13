const socket = io()

// elements
const input = document.getElementById('message-input')
const form = document.getElementById('form')
const loc_btn = document.getElementById('location-btn')
const send_btn = document.getElementById('send-btn')
const message_container = document.getElementById('message-container')

// templates
const messageTemplate = document.getElementById('message-template').innerHTML
const locTemplate = document.getElementById('loc-template').innerHTML
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML

// options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })


const autoscroll = () => {
    // new message element
    const newMessage = message_container.lastElementChild

    // height of the new message
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    // visible height
    const visibleHeight = message_container.offsetHeight

    // message of message container
    const containerHeight = message_container.scrollHeight

    // how far have i scrolled
    const scrollOffset = message_container.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        message_container.scrollTop = message_container.scrollHeight
    }
}


socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    message_container.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message);
    const html = Mustache.render(locTemplate, {
        username: message.username,
        message: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    message_container.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.getElementById('sidebar').innerHTML = html
})


form.addEventListener('submit', (e) => {
    e.preventDefault()
    // disable
    send_btn.setAttribute('disabled', 'disabled')
    socket.emit('sendMessage', input.value, (error) => {
        // enable
        send_btn.removeAttribute('disabled')
        input.value = ''
        input.focus()
        if (error) {
            return console.log(error);
        }
        console.log('Message Delivered');
    })
})

loc_btn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }
    // disable location btn
    loc_btn.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition(
        (pos) => { // success
            socket.emit('sendLocation', {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
            }, (message) => {
                // enable location btn
                loc_btn.removeAttribute('disabled')
                console.log(message);
            })
        },
        (err) => { // error
            loc_btn.removeAttribute('disabled')
            console.log(err.message);
        },
        { // options
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})






