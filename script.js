const
    totalBalance = document.querySelector('.total__balance'),
    totalMoneyIncome = document.querySelector('.total__money-income'),
    totalMoneyExpenses = document.querySelector('.total__money-expenses'),
    historyList = document.querySelector('.history__list'),
    form = document.querySelector('#form'),
    operationHeader = document.querySelector('.operation__header'),
    operationName = document.querySelector('.operation__name'),
    operationAmount = document.querySelector('.operation__amount'),
    balance = document.querySelector('.balance'),
    info = document.querySelector('.info'),
    popUp = document.querySelector('.popUp'),
    errorMesage = document.querySelector('.error');
/* -- Indexed DB -- */
    let dbOperation = [];
    let openRequest = indexedDB.open("store", 1);
    openRequest.onsuccess = function() {
        let db = openRequest.result;
        let transaction = db.transaction('operations', 'readonly').objectStore('operations');
        transaction.getAll().onsuccess = function(event) {
                if (event.srcElement.result.length > 0) {
                    let count = event.srcElement.result.length
                    for (let i=0; i < count; i++) {
                        dbOperation.push(event.srcElement.result[i]);
                    };
                }
                init();
            }
        }
    openRequest.onupgradeneeded = function() {
        let db = openRequest.result;
        if (!db.objectStoreNames.contains('operations')) {
            db.createObjectStore('operations', {keyPath: 'time'});
        }
    };
/* -- Scroll control -- */
    const up = () => {
        var t;
        var top = Math.max(document.body.scrollTop,document.documentElement.scrollTop);
        if(top > 0) {
            window.scrollBy(0,-100);
            t = setTimeout('up()',50);
        }
        else clearTimeout(t);
        return false;
    };
    const down = () => {
        var t;
        var top = Math.max(document.body.scrollTop,document.documentElement.scrollTop);
        if(top == 0) {
            window.scrollBy(0, 999999999);
            t = setTimeout('down()',50);
        }
        else clearTimeout(t);
        return false;
    };
/* -- Show/hide info box -- */
    const operationHeaderCheck = () => {
        if (dbOperation.length == 0) {
            operationHeader.style.cssText = 'display:none;';
            balance.style.cssText = 'display:none;';
            info.style.cssText = '';
        }
        else {
            operationHeader.style.cssText = '';
            balance.style.cssText = '';
            info.style.cssText = 'display:none;';
        }
    };
/* -- Pop-up image control -- */
    const showImage = (src) => {
        img = document.createElement("img");
        img.src = src;
        img.className = 'popUpImage';
        if (popUp.childNodes.length > 0) {
            popUp.removeChild(popUp.firstChild);
        }
        popUp.appendChild(img);
        up();
    };
    const hideImage = () => {
        if (popUp.childNodes.length > 0) {
            popUp.removeChild(popUp.firstChild);
        }
        down();
    };
/* -- Id generator -- */
    const generateId = () => `operation_id:${Math.round(Math.random() * 1e8).toString(16)}`
/* -- Main functionality -- */
    const maxLengthCheck = (object) => {
        if (object.value.length > object.maxLength)
        object.value = object.value.slice(0, object.maxLength)
    }
    const renderOperation = (operation) => {
        const className = operation.amount < 0 ? 'history__item-minus' : 'history__item-plus';
        const listItem = document.createElement('li');
        listItem.classList.add('history__item');
        listItem.classList.add(className);
        listItem.innerHTML = `${operation.time}
        <br>${operation.description}
        <span class="history__money" data-id="${operation.time}">${operation.amount} ₽</span>
        <button class="history__delete" data-id="${operation.time}">X</button>`;
        historyList.append(listItem);
    };
    const updateBalance = () => {
        const resultIncome = dbOperation
            .filter((item) => item.amount > 0)
            .reduce((result, item) => result + item.amount, 0);
        const resultExpenses = dbOperation
            .filter((item) => item.amount < 0)
            .reduce((result, item) => result + item.amount, 0);
        totalMoneyIncome.textContent = resultIncome + ' ₽';
        totalMoneyExpenses.textContent = resultExpenses + ' ₽';
        totalBalance.textContent = (resultIncome + resultExpenses) + ' ₽';
    };
    const addOperation = (event) => {
        event.preventDefault();
        const
            operationNameValue = operationName.value,
            operationAmountValue = operationAmount.value;
            operationAttachement = document.getElementById('upload').files[0];
            operationName.style.borderColor = '';
            operationAmount.style.borderColor = '';
            if (operationNameValue && operationAmountValue){
                if (!operationAttachement) {
                    /* -- indexedDB push -- */
                    let db = openRequest.result;
                    let transaction = db.transaction("operations", "readwrite");
                    let indexedDbOperations = transaction.objectStore("operations");
                    let indexedDbOperation = {
                        id: generateId(),
                        description: operationNameValue,
                        amount: +operationAmountValue,
                        time: new Date().toLocaleString(),
                        attachement: 'no_image.png'
                    };
                    let request = indexedDbOperations.add(indexedDbOperation);
                    request.onsuccess = function() {
                        dbOperation.push(indexedDbOperation);
                        init();
                    };
                    request.onerror = function() {
                        console.log("IndexedDB error", request.error);
                    };
                }
                else {
                let reader = new FileReader();
                reader.readAsDataURL(operationAttachement);
                reader.onload = function() {
                    /* -- indexedDB push -- */
                    let db = openRequest.result;
                    let transaction = db.transaction("operations", "readwrite");
                    let indexedDbOperations = transaction.objectStore("operations");
                    let indexedDbOperation = {
                        id: generateId(),
                        description: operationNameValue,
                        amount: +operationAmountValue,
                        time: new Date().toLocaleString(),
                        attachement: reader.result
                    };
                    let request = indexedDbOperations.add(indexedDbOperation);
                    request.onsuccess = function() {
                        dbOperation.push(indexedDbOperation);
                        init();
                    };
                    request.onerror = function() {
                        console.log("IndexedDB error", request.error);
                    };
                };
            };
            } else {
                if (!operationNameValue) operationName.style.borderColor = 'red';
                if (!operationAmountValue) operationAmount.style.borderColor = 'red';
            }
            operationName.value = '';
            operationAmount.value = '';
            document.getElementById("upload").value = "";;
    };
const deleteOperation = (event) => {
    const target = event.target
    if (event.target.classList.contains('history__delete')) {
        dbOperation = dbOperation.filter(operation => operation.time !== target.dataset.id);
        let openRequest = indexedDB.open("store", 1);
        let delKey = target.dataset.id;
        openRequest.onsuccess = function() {
            let db = openRequest.result;
            let transaction = db.transaction('operations', 'readwrite').objectStore('operations');
            transaction.delete(delKey).onsuccess = function(event) {
                    console.log(delKey);
                }
            }
        init();
    }
    /* -- Image pop-up -- */
    if (event.target.classList.contains('history__money')) {
        outputInfo = dbOperation.filter(operation => operation.time !== target.dataset.id);
        if (outputInfo.length == 0) {
            showImage(dbOperation[0].attachement);
        }
        else {
            outputInfo = dbOperation.filter(operation => operation.time == target.dataset.id);
            showImage(outputInfo[0].attachement);
        }
    }
};
/* -- Main init -- */
    const init = () => {
        historyList.textContent = '';
        dbOperation.forEach(renderOperation)
        updateBalance();
        operationHeaderCheck();
        errorMesage.textContent = '';
        errorMesage.style.padding = '';
        errorMesage.style.borderStyle = '';
    };
/* -- Listeners --*/
    form.addEventListener('submit', addOperation);
    historyList.addEventListener('click', deleteOperation);
/* -- First launch header check -- */
    operationHeaderCheck();
