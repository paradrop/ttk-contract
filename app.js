// app.js
(function(){
  const endpoint = 'https://mpc3ec4b5d7d11f2d3db.free.beeceptor.com';
  const cmsEndpoint = 'https://mpc3ec4b5d7d11f2d3db.free.beeceptor.com/cms';

  function el(id){ return document.getElementById(id); }
  function qsel(selector){ return document.querySelector(selector); }
  function pad(n){ return n < 10 ? '0'+n : n; }

  // normalize phone number: remove '+' and keep only digits
  function normalizePhone(phone){
    return phone.replace(/\+/g, '').trim();
  }

  function formatDateNow(){
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate())
           + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  // read checkbox states -> {n:bool,e:bool}
  function checkboxChoiceToBooleans(nId, eId){
    const nCheckbox = el(nId);
    const eCheckbox = el(eId);
    return {
      n: nCheckbox ? nCheckbox.checked : false,
      e: eCheckbox ? eCheckbox.checked : false
    };
  }

  function buildPayload(){
    const catv = checkboxChoiceToBooleans('catv_n', 'catv_e');
    const internet = checkboxChoiceToBooleans('int_n', 'int_e');
    const cctv = checkboxChoiceToBooleans('cctv_n', 'cctv_e');
    const intercom = checkboxChoiceToBooleans('icom_n', 'icom_e');
    const iptv = checkboxChoiceToBooleans('iptv_n', 'iptv_e');
    const router = checkboxChoiceToBooleans('rout_n', 'rout_e');

    return {
      services: [
        {"catv" : {"catv_n" : !!catv.n, "catv_e" : !!catv.e }},
        {"internet" : {"int_n" : !!internet.n, "int_e" : !!internet.e }},
        {"cctv" : {"cctv_n" : !!cctv.n, "cctv_e" : !!cctv.e }},
        {"intercom" : {"icom_n" : !!intercom.n, "icom_e" : !!intercom.e }},
        {"iptv" : {"iptv_n" : !!iptv.n, "iptv_e" : !!iptv.e }},
        {"router" : {"rout_n" : !!router.n, "rout_e" : !!router.e }}
      ],
      upinfo: [
        {"fio" : {
          "firstname" : el('firstname').value.trim(),
          "middlename": el('middlename').value.trim(),
          "lastname" : el('lastname').value.trim()
        }},
        {"raddress" : el('raddress').value.trim()},
        {"saddress" : el('saddress').value.trim()},
        {"iin": el('iin').value.trim()},
        {"mobile": normalizePhone(el('mobile').value)},
        {"whatsapp": normalizePhone(el('whatsapp').value)}
      ],
      "manager": el('manager').value.trim(),
      "cdate": formatDateNow()
    };
  }

  // validate single field
  function validateField(id){
    const field = el(id);
    if(!field) return true;

    const value = field.value.trim();
    const err = document.querySelector(`.error[data-for="${id}"]`);
    
    // skip validation if field is disabled (e.g., when "Same as..." is checked)
    if(field.disabled){
      if(err) err.textContent = '';
      return true;
    }

    // required text fields
    const requiredText = ['lastname','firstname','middlename','raddress','saddress','manager'];
    if(requiredText.includes(id)){
      if(!value){
        if(err) err.textContent = 'Обязательное поле';
        return false;
      } else {
        if(err) err.textContent = '';
        return true;
      }
    }

    // IIN: 12 digits only
    if(id === 'iin'){
      if(!/^\d{12}$/.test(value)){
        if(err) err.textContent = 'ИИН должен содержать ровно 12 цифр';
        return false;
      } else {
        if(err) err.textContent = '';
        return true;
      }
    }

    // phone & whatsapp: format +7XXXXXXXXXX
    const phoneRegex = /^\+7\d{10}$/;
    if(id === 'mobile'){
      if(!phoneRegex.test(value)){
        if(err) err.textContent = 'Телефон в формате +7XXXXXXXXXX';
        return false;
      } else {
        if(err) err.textContent = '';
        return true;
      }
    }

    if(id === 'whatsapp'){
      if(!phoneRegex.test(value)){
        if(err) err.textContent = 'WhatsApp в формате +7XXXXXXXXXX';
        return false;
      } else {
        if(err) err.textContent = '';
        return true;
      }
    }

    return true;
  }

  // validation rules
  function validateAll(){
    // clear previous errors
    document.querySelectorAll('.error').forEach(n => n.textContent = '');

    let ok = true;

    // text fields required
    const requiredText = ['lastname','firstname','middlename','raddress','saddress','manager'];
    requiredText.forEach(id => {
      const v = el(id).value.trim();
      const err = document.querySelector(`.error[data-for="${id}"]`);
      if(!v){
        ok = false;
        if(err) err.textContent = 'Обязательное поле';
      }
    });

    // IIN: 12 digits only
    const iinVal = el('iin').value.trim();
    const iinErr = document.querySelector('.error[data-for="iin"]');
    if(!/^\d{12}$/.test(iinVal)){
      ok = false;
      if(iinErr) iinErr.textContent = 'ИИН должен содержать ровно 12 цифр';
    }

    // phone & whatsapp: format +7XXXXXXXXXX (plus +7 and 10 digits)
    const phoneRegex = /^\+7\d{10}$/;
    const mobileVal = el('mobile').value.trim();
    const mobileErr = document.querySelector('.error[data-for="mobile"]');
    if(!phoneRegex.test(mobileVal)){
      ok = false;
      if(mobileErr) mobileErr.textContent = 'Телефон в формате +7XXXXXXXXXX';
    }

    const waVal = el('whatsapp').value.trim();
    const waErr = document.querySelector('.error[data-for="whatsapp"]');
    if(!phoneRegex.test(waVal)){
      ok = false;
      if(waErr) waErr.textContent = 'WhatsApp в формате +7XXXXXXXXXX';
    }

    return ok;
  }

  // encode Uint8Array to base64
  function uint8ArrayToBase64(bytes) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // decode base64 to Uint8Array
  function base64ToUint8Array(base64) {
    // remove any whitespace and newlines that might be present
    const cleanBase64 = base64.replace(/\s/g, '');
    const binaryStr = atob(cleanBase64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  }

  // guess mime and extension from first bytes
  function guessFileType(bytes) {
    // check PK zip header 50 4B 03 04 (docx files are zip archives)
    if (bytes[0] === 0x50 && bytes[1] === 0x4B) return { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' };
    // check PDF 25 50 44 46
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44) return { mime: 'application/pdf', ext: 'pdf' };
    // fallback
    return { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' };
  }

  async function sendJson(){
    // validate first
    const generateStatus = el('generateStatus');
    generateStatus.textContent = '';
    generateStatus.style.color = '';
    el('downloadArea').innerHTML = '';
    if(!validateAll()){
      generateStatus.textContent = 'Форма содержит ошибки. Исправьте и повторите отправку.';
      generateStatus.style.color = '#c23';
      return;
    }

    const sendBtn = el('sendBtn');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Отправка...';

    const payload = buildPayload();

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });

      const text = await resp.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch(e){ parsed = text; }

      console.log('Response status:', resp.status, resp.statusText);
      console.log('Response body:', parsed);

      // if parsed is object and has generated_document
      if(parsed && typeof parsed === 'object' && parsed.generated_document){
        try {
          const b64 = parsed.generated_document;
          console.log('Base64 string length:', b64.length);
          console.log('Base64 first 100 chars:', b64.substring(0, 100));
          
          const bytes = base64ToUint8Array(b64);
          console.log('Decoded bytes length:', bytes.length);
          console.log('First 10 bytes:', Array.from(bytes.slice(0, 10)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
          
          const info = guessFileType(bytes);
          console.log('Detected file type:', info);
          
          const blob = new Blob([bytes], { type: info.mime });
          console.log('Blob created:', blob.size, 'bytes, type:', blob.type);
          
          const url = URL.createObjectURL(blob);
          const filename = 'generated_document.' + info.ext;

          // show success status
          generateStatus.textContent = 'Готово! Файл готов к скачиванию.';
          generateStatus.style.color = '#28a745';

          // create link and append
          const downloadBtn = createDownloadButton(blob, filename, 'Повторно скачать заполненный договор', 'btn-download');
          el('downloadArea').appendChild(downloadBtn);

          // add instructions for signing the document
          const instructions = document.createElement('div');
          instructions.className = 'signing-instructions';
          instructions.innerHTML = `
            <h2>Как подписать договор</h2>
            <ol>
              <li>Внимательно проверьте заполненный договор </li>
              <li>На компьютере должен быть установлен <a href="https://ncl.pki.gov.kz/" target="_blank" rel="noopener noreferrer"><strong>NCALayer</strong></a> и модуль <strong>ezsigner</strong></li>
              <li>Нажмите кнопку <a href="https://ezsigner.kz" target="_blank" rel="noopener noreferrer" class="ezsigner-button">Перейти к подписанию</a> — откроется сайт ezsigner.kz в новой вкладке</li>
              <li>На ezsigner.kz:
                <ul>
                  <li>Выберите опцию <strong>«Подписать документ»</strong></li>
                  <li>Загрузите ранее скачанный <code>.docx</code></li>
                  <li>Подпишите документ, выбрав вашу ЭЦП</li>
                  <li>После успешной подписи скачайте файл <code>.cms</code> (это результат подписи).</li>
                </ul>
              </li>
              <li>Вернитесь на страницу нашего сайта и нажмите кнопку ниже для загрузки подписанного файла:
                <div class="cms-upload-section">
                  <input type="file" id="cmsFileInput" accept=".cms" style="display:none;">
                  <button type="button" class="btn-upload" id="uploadCmsBtn">Загрузить подписанный договор</button>
                  <div class="upload-status"></div>
                  <div class="cms-download-container"></div>
                </div>
              </li>
              <li>После успешной проверки файл автоматически начнёт скачиваться.</li>
              <li>Сохраните финальный файл на компьютере и сделайте резервные копии (флешка, внешний диск, облако). Этот <code>.cms</code> — ваш юридически значимый договор.</li>
            </ol>
          `;
          el('downloadArea').appendChild(instructions);

          // setup CMS upload button and file input
          const cmsFileInput = instructions.querySelector('#cmsFileInput');
          const uploadCmsBtn = instructions.querySelector('#uploadCmsBtn');
          const uploadSection = instructions.querySelector('.cms-upload-section');

          uploadCmsBtn.addEventListener('click', () => {
            cmsFileInput.click();
          });

          cmsFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
              await handleCmsUpload(file, uploadSection);
            }
          });

          // also auto-click to start download
          setTimeout(() => {
            try { downloadBtn.click(); } catch(e){ console.warn('Автозагрузка не удалась', e); }
          }, 200);

        } catch (err) {
          console.error('Ошибка при декодировании файла:', err);
          generateStatus.textContent = 'Не удалось декодировать и скачать файл: ' + (err.message || err);
          generateStatus.style.color = '#c23';
        }
      } else {
        generateStatus.textContent = 'В ответе от сервера нет поля "generated_document".';
        generateStatus.style.color = '#c23';
      }

    } catch (err) {
      console.error('Ошибка при отправке:', err);
      generateStatus.textContent = 'Ошибка при отправке: ' + (err.message || String(err));
      generateStatus.style.color = '#c23';
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Сформировать договор';
    }
  }

  // create a download button that stores blob URL for reuse
  function createDownloadButton(blob, filename, buttonText, className = 'download-link') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.textContent = buttonText;
    a.className = className;
    return a;
  }

  // handle CMS file upload, encode, send to server, and download result
  async function handleCmsUpload(file, uploadSection) {
    const statusDiv = uploadSection.querySelector('.upload-status');
    const downloadContainer = uploadSection.querySelector('.cms-download-container');
    
    statusDiv.textContent = 'Обработка файла...';
    downloadContainer.innerHTML = '';

    try {
      // read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // encode to base64
      const base64Cms = uint8ArrayToBase64(bytes);
      console.log('CMS file encoded, base64 length:', base64Cms.length);

      // send to endpoint
      statusDiv.textContent = 'Отправка на сервер...';
      const resp = await fetch(cmsEndpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ cms: base64Cms })
      });

      if (!resp.ok) {
        throw new Error('Сервер вернул ошибку: ' + resp.status + ' ' + resp.statusText);
      }

      const result = await resp.json();
      console.log('CMS response received:', result);

      if (!result.signed_cms) {
        throw new Error('В ответе от сервера нет поля "signed_cms"');
      }

      // decode the signed CMS
      const signedBytes = base64ToUint8Array(result.signed_cms);
      console.log('Signed CMS decoded, bytes length:', signedBytes.length);
      
      const info = guessFileType(signedBytes);
      const blob = new Blob([signedBytes], { type: info.mime });
      const filename = 'signed_document.' + info.ext;

      // create download button
      const downloadBtn = createDownloadButton(blob, filename, 'Повторно скачать финальный документ', 'btn-download');
      downloadContainer.appendChild(downloadBtn);

      statusDiv.textContent = 'Готово! Файл готов к скачиванию.';
      statusDiv.style.color = '#28a745';

      // auto-download
      setTimeout(() => {
        try { downloadBtn.click(); } catch(e){ console.warn('Автозагрузка не удалась', e); }
      }, 200);

    } catch (err) {
      console.error('Ошибка при обработке CMS:', err);
      statusDiv.textContent = 'Ошибка: ' + (err.message || String(err));
      statusDiv.style.color = '#c23';
    }
  }

  // "Same as..." functionality
  function setupSameAs(checkboxId, sourceId, targetId, emptyErrorMsg){
    const checkbox = el(checkboxId);
    const sourceField = el(sourceId);
    const targetField = el(targetId);
    const targetErr = document.querySelector(`.error[data-for="${targetId}"]`);

    if(!checkbox || !sourceField || !targetField) return;

    // handle checkbox change
    checkbox.addEventListener('change', function(){
      if(this.checked){
        // check if source field is empty
        const sourceVal = sourceField.value.trim();
        if(!sourceVal){
          // uncheck and show error
          this.checked = false;
          if(targetErr) targetErr.textContent = emptyErrorMsg;
          sourceField.focus();
          return;
        }
        // copy value from source to target
        targetField.value = sourceVal;
        targetField.disabled = true;
        // clear any errors on target
        if(targetErr) targetErr.textContent = '';
      } else {
        // enable target field for editing
        targetField.disabled = false;
        targetField.focus();
      }
    });

    // live sync: when source changes and checkbox is checked, update target
    sourceField.addEventListener('input', function(){
      if(checkbox.checked){
        targetField.value = this.value;
        // clear target errors while syncing
        if(targetErr) targetErr.textContent = '';
      }
    });

    // if user tries to edit disabled field, inform them
    targetField.addEventListener('click', function(){
      if(this.disabled && checkbox.checked){
        if(targetErr) {
          targetErr.textContent = 'Отключите опцию "Тот же..." чтобы редактировать это поле';
          setTimeout(() => {
            if(targetErr) targetErr.textContent = '';
          }, 3000);
        }
      }
    });
  }

  // setup WhatsApp same as Mobile
  setupSameAs(
    'whatsapp_same_as_mobile',
    'mobile',
    'whatsapp',
    'Сначала введите номер телефона'
  );

  // setup saddress same as raddress
  setupSameAs(
    'saddress_same_as_raddress',
    'raddress',
    'saddress',
    'Сначала укажите адрес проживания'
  );

  // setup single choice for each service (new or existing, but not both)
  function setupSingleChoice(newId, existingId){
    const newCheckbox = el(newId);
    const existingCheckbox = el(existingId);
    
    if(!newCheckbox || !existingCheckbox) return;
    
    newCheckbox.addEventListener('change', function(){
      if(this.checked && existingCheckbox.checked){
        existingCheckbox.checked = false;
      }
    });
    
    existingCheckbox.addEventListener('change', function(){
      if(this.checked && newCheckbox.checked){
        newCheckbox.checked = false;
      }
    });
  }

  // setup for all services
  setupSingleChoice('catv_n', 'catv_e');
  setupSingleChoice('int_n', 'int_e');
  setupSingleChoice('cctv_n', 'cctv_e');
  setupSingleChoice('icom_n', 'icom_e');
  setupSingleChoice('iptv_n', 'iptv_e');
  setupSingleChoice('rout_n', 'rout_e');

  // check if form is valid without showing errors
  function isFormValid(){
    // check text fields required
    const requiredText = ['lastname','firstname','middlename','raddress','saddress','manager'];
    for(let id of requiredText){
      if(!el(id).value.trim()) return false;
    }

    // check IIN: 12 digits only
    const iinVal = el('iin').value.trim();
    if(!/^\d{12}$/.test(iinVal)) return false;

    // check phone & whatsapp: format +7XXXXXXXXXX
    const phoneRegex = /^\+7\d{10}$/;
    const mobileVal = el('mobile').value.trim();
    if(!phoneRegex.test(mobileVal)) return false;

    const waVal = el('whatsapp').value.trim();
    if(!phoneRegex.test(waVal)) return false;

    return true;
  }

  // update send button state
  function updateSendButtonState(){
    const sendBtn = el('sendBtn');
    sendBtn.disabled = !isFormValid();
  }

  // wire events
  el('sendBtn').addEventListener('click', function(e){
    e.preventDefault();
    sendJson();
  });

  // live simple validation: clear error when user types/selects
  const inputs = ['lastname','firstname','middlename','iin','mobile','whatsapp','raddress','saddress','manager'];
  inputs.forEach(id => {
    const node = el(id);
    if(node){
      // clear error on input
      node.addEventListener('input', () => {
        const err = document.querySelector(`.error[data-for="${id}"]`);
        if(err) err.textContent = '';
        updateSendButtonState();
      });
      // validate on blur (when field loses focus)
      node.addEventListener('blur', () => {
        validateField(id);
        updateSendButtonState();
      });
    }
  });

  // also clear errors when checkboxes are toggled
  el('whatsapp_same_as_mobile').addEventListener('change', function(){
    const err = document.querySelector('.error[data-for="whatsapp"]');
    if(err) err.textContent = '';
    updateSendButtonState();
  });
  el('saddress_same_as_raddress').addEventListener('change', function(){
    const err = document.querySelector('.error[data-for="saddress"]');
    if(err) err.textContent = '';
    updateSendButtonState();
  });

  // initialize button state on page load
  updateSendButtonState();

})();
