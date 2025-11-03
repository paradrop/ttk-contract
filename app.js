// app.js
(function(){
  const endpoint = 'https://mpc3ec4b5d7d11f2d3db.free.beeceptor.com';

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

  function showJson(){
    if(!validateAll()){
      el('jsonOutput').textContent = 'Есть ошибки в форме — исправьте их перед просмотром JSON.';
      return;
    }
    const p = buildPayload();
    el('jsonOutput').textContent = JSON.stringify(p, null, 2);
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
    el('serverOutput').textContent = '';
    el('downloadArea').innerHTML = '';
    if(!validateAll()){
      el('serverOutput').textContent = 'Форма содержит ошибки. Исправьте и повторите отправку.';
      return;
    }

    const sendBtn = el('sendBtn');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Отправка...';

    const payload = buildPayload();
    el('jsonOutput').textContent = JSON.stringify(payload, null, 2);

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

      el('serverOutput').textContent = 'Status: ' + resp.status + ' ' + resp.statusText + '\n\n' +
                                      (typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2));

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

          // create link and append
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.textContent = 'Скачать файл: ' + filename;
          a.className = 'download-link';
          el('downloadArea').appendChild(a);

          // add instructions for signing the document
          const instructions = document.createElement('div');
          instructions.className = 'signing-instructions';
          instructions.innerHTML = `
            <h2>Как подписать договор</h2>
            <ol>
              <li>Нажмите кнопку <a href="https://ezsigner.kz" target="_blank" rel="noopener noreferrer" class="ezsigner-button">Перейти к подписанию</a> — откроется сайт ezsigner.kz в новой вкладке</li>
              <li>На компьютере должен быть установлен <strong>NCALayer</strong> и модуль <strong>ezsigner</strong></li>
              <li>На ezsigner.kz:
                <ul>
                  <li>Выберите опцию <strong>«Подписать документ»</strong></li>
                  <li>Загрузите ранее скачанный <code>.docx</code></li>
                  <li>Подпишите документ, выбрав вашу ЭЦП</li>
                  <li>После успешной подписи скачайте файл <code>.cms</code> (это результат подписи).</li>
                </ul>
              </li>
              <li>Вернитесь на страницу нашего сайта и нажмите <strong>«Загрузить подписанный договор»</strong>.
                <ul>
                  <li>Выберите подписанный <code>.cms</code> файл.</li>
                </ul>
              </li>
              <li>После успешной проверки вы получите готовый файл для скачивания.</li>
              <li>Сохраните финальный файл на компьютере и сделайте резервные копии (флешка, внешний диск, облако). Этот <code>.cms</code> — ваш юридически значимый договор.</li>
            </ol>
          `;
          el('downloadArea').appendChild(instructions);

          // also auto-click to start download
          setTimeout(() => {
            try { a.click(); } catch(e){ console.warn('Автозагрузка не удалась', e); }
          }, 200);

        } catch (err) {
          console.error('Ошибка при декодировании файла:', err);
          el('downloadArea').textContent = 'Не удалось декодировать и скачать файл: ' + (err.message || err);
        }
      } else {
        el('downloadArea').textContent = 'В ответе от сервера нет поля "generated_document".';
      }

    } catch (err) {
      console.error('Ошибка при отправке:', err);
      el('serverOutput').textContent = 'Ошибка при отправке: ' + (err.message || String(err));
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Сформировать договор';
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

  // wire events
  el('showJsonBtn').addEventListener('click', function(e){
    e.preventDefault();
    showJson();
  });
  el('sendBtn').addEventListener('click', function(e){
    e.preventDefault();
    sendJson();
  });

  // live simple validation: clear error when user types/selects
  const inputs = ['lastname','firstname','middlename','iin','mobile','whatsapp','raddress','saddress','manager'];
  inputs.forEach(id => {
    const node = el(id);
    if(node) node.addEventListener('input', () => {
      const err = document.querySelector(`.error[data-for="${id}"]`);
      if(err) err.textContent = '';
    });
  });

  // also clear errors when checkboxes are toggled
  el('whatsapp_same_as_mobile').addEventListener('change', function(){
    const err = document.querySelector('.error[data-for="whatsapp"]');
    if(err) err.textContent = '';
  });
  el('saddress_same_as_raddress').addEventListener('change', function(){
    const err = document.querySelector('.error[data-for="saddress"]');
    if(err) err.textContent = '';
  });

})();
