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
    errorMesage = document.querySelector('.error'),
    downloadBtn = document.querySelector('.download__btn');
/* -- Math -- */
    const round = (value, decimals) => {
        return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    }
/* -- Indexed DB -- */
    let dbOperation = [];
    let openRequest = indexedDB.open("store", 1);
    openRequest.onsuccess = function() {
        openRequest.result.transaction('operations', 'readonly')
            .objectStore('operations').getAll().onsuccess = function(event) {
                if (event.srcElement.result.length > 0) {
                    let count = event.srcElement.result.length
                    for (let i=0; i < count; i++) {
                        dbOperation.push(event.srcElement.result[i]);
                    };
                }
                init();
            }
    };
    openRequest.onupgradeneeded = function() {
        let db = openRequest.result;
        if (!db.objectStoreNames.contains('operations')) {
            db.createObjectStore('operations', {keyPath: 'time'});
        }
    };
    openRequest.onerror = function() {
        console.log('123');
    };
/* -- Scroll control -- */
    const up = () => {
        var t;
        var top = Math.max(document.body.scrollTop,document.documentElement.scrollTop);
        if(top > 0) {
            window.scrollBy(0,-100);
            t = setTimeout('up()',25);
        }
        else clearTimeout(t);
        return false;
    };
    const down = () => {
        var t;
        var top = Math.max(document.body.scrollTop,document.documentElement.scrollTop);
        if(top == 0) {
            window.scrollBy(0, 999999999999999);
        }
        return false;
    };
/* -- Show/hide info box -- */
    const operationHeaderCheck = () => {
        if (dbOperation.length == 0) {
            operationHeader.style.cssText = 'display:none;';
            balance.style.cssText = 'display:none;';
            info.style.cssText = '';
            downloadBtn.style.cssText = 'display:none;';
        }
        else {
            operationHeader.style.cssText = '';
            balance.style.cssText = '';
            info.style.cssText = 'display:none;';
            downloadBtn.style.cssText = '';
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
        <span class="history__money" data-id="${operation.id}">${operation.amount} ₽</span>
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
        totalMoneyIncome.textContent = round(resultIncome, 2) + ' ₽';
        totalMoneyExpenses.textContent = round(resultExpenses, 2) + ' ₽';
        let summ = resultIncome + resultExpenses;
        totalBalance.textContent = round(summ, 2) + ' ₽';
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
                if (operationAttachement && operationAttachement.size < 9999999) {
                    let reader = new FileReader();
                    reader.readAsDataURL(operationAttachement);
                    reader.onload = function() {
                        let indexedDbOperation = {
                            id: generateId(),
                            description: operationNameValue,
                            amount: +operationAmountValue,
                            time: new Date().toLocaleString(),
                            attachement: reader.result
                        };
                        let request = openRequest.result.transaction("operations", "readwrite")
                            .objectStore("operations").add(indexedDbOperation);
                        request.onsuccess = function() {dbOperation.push(indexedDbOperation); init();};
                        request.onerror = function() {
                            let indexedDbOperation = {
                                id: generateId(),
                                description: operationNameValue,
                                amount: +operationAmountValue,
                                time: new Date().toLocaleString(),
                                attachement: 'no_image.png'
                            };
                            let request = openRequest.result.transaction("operations", "readwrite")
                                .objectStore("operations").add(indexedDbOperation);
                            request.onsuccess = function() {
                                dbOperation.push(indexedDbOperation);
                                init();
                                errorMesage.textContent = 'Кассовый чек не сохранен, размер прикладываемого файла превышает лимит локальной базы данных вашего браузера';
                                errorMesage.style.padding = '15px';
                                errorMesage.style.borderStyle = 'solid';
                                console.log('Attacement lost, file is to big.');
                            };
                        };
                    };
                }
                else {
                    let indexedDbOperation = {
                        id: generateId(),
                        description: operationNameValue,
                        amount: +operationAmountValue,
                        time: new Date().toLocaleString(),
                        attachement: 'no_image.png'
                    };
                    let request = openRequest.result.transaction("operations", "readwrite")
                        .objectStore("operations").add(indexedDbOperation);
                    request.onsuccess = function() {
                        dbOperation.push(indexedDbOperation);
                        init();
                        errorMesage.textContent = 'Кассовый чек не сохранен, размер прикладываемого файла превышает 8,5 MB';
                        errorMesage.style.padding = '15px';
                        errorMesage.style.borderStyle = 'solid';
                        console.log('Attacement lost, file is to big.');
                    };
                };
            }
            else {
                if (!operationNameValue) operationName.style.borderColor = 'red';
                if (!operationAmountValue) operationAmount.style.borderColor = 'red';
            }
            operationName.value = '';
            operationAmount.value = '';
            document.getElementById("upload").value = "";
    };
    const deleteOperation = (event) => {
        const target = event.target
        if (event.target.classList.contains('history__delete')) {
            dbOperation = dbOperation.filter(operation => operation.time !== target.dataset.id);
            let delKey = target.dataset.id;
            openRequest.result.transaction('operations', 'readwrite')
                .objectStore('operations').delete(delKey).onsuccess = function () {init();};
        }
        /* -- Image pop-up -- */
        if (event.target.classList.contains('history__money')) {
            outputInfo = dbOperation.filter(operation => operation.id !== target.dataset.id);
            if (outputInfo.length == 0) {
                showImage(dbOperation[0].attachement);
            }
            else {
                outputInfo = dbOperation.filter(operation => operation.id == target.dataset.id);
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
/* -- File processing -- */
    const writeFile = (name, value) => {
        var val = value;
        if (value === undefined) {
        val = "";
        }
        var download = document.createElement("a");
        download.href = "data:text/plain;content-disposition=attachment;filename=file," + val;
        download.download = name;
        download.style.display = "none";
        download.id = "download"; document.body.appendChild(download);
        document.getElementById("download").click();
        document.body.removeChild(download);
    }
    const download = () => {
        let outputData = [];
        let count = dbOperation.length
        for (let i=0; i < count; i++) {
            let divColor = '';
            let imgSrc = '';
            if (dbOperation[i].amount < 0) {
                divColor = 'tomato';
            }
            else {
                divColor = 'darkgreen';
            }
            if (dbOperation[i].attachement == 'no_image.png') {
                imgSrc = 'data:image/png;base64,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';
            }
            else {
                imgSrc = dbOperation[i].attachement;
            }
            let data = "<div style='background-color: " + divColor + "; margin: 0 25vw; padding: 10px;'>" +
            "<div style='display: flex; justify-content: center;'>" +
            "<p style='color: white; background-color: gray; border-width: 2px; border-style: solid; border-color: black; border-radius: 1px; padding: 5px 22px; width: 20vw; text-align: center; margin: 5px;'>" + dbOperation[i].time + '</p>' + "</div>" +
            "<div style='display: flex; justify-content: center;'>" +
            "<p style='color: white; background-color: gray; border-width: 2px; border-style: solid; border-color: black; border-radius: 1px; padding: 5px; width: 10vw; text-align: center; margin: 10px;'>" + dbOperation[i].description + '</p>' +
            "<p style='color: white; background-color: gray; border-width: 2px; border-style: solid; border-color: black; border-radius: 1px; padding: 5px; width: 10vw; text-align: center; margin: 10px;'>" + dbOperation[i].amount + '</p>' + "</div>" +
            "<img src='" + imgSrc + "' style='width: 100%;'>" +
            "</div>";
            outputData.push(data);
        }
        outputData.push("<style type='text/css'>body{background-color: black;}</style>");
        writeFile(`operations_history_${Date().toLocaleString()}.html`, JSON.stringify(outputData));
    };
/* -- Listeners --*/
    form.addEventListener('submit', addOperation);
    historyList.addEventListener('click', deleteOperation);
/* -- First launch header check -- */
    operationHeaderCheck();
