const _typeof = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype ? 'symbol' : typeof obj; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

(function () {
  const typesToPatch = ['DocumentType', 'Element', 'CharacterData'];
  const remove = function remove() {
    // The check here seems pointless, since we're not adding this
    // method to the prototypes of any any elements that CAN be the
    // root of the DOM. However, it's required by spec (see point 1 of
    // https://dom.spec.whatwg.org/#dom-childnode-remove) and would
    // theoretically make a difference if somebody .apply()ed this
    // method to the DOM's root node, so let's roll with it.
    if (this.parentNode != null) {
      this.parentNode.removeChild(this);
    }
  };

  for (let i = 0; i < typesToPatch.length; i++) {
    const type = typesToPatch[i];
    if (window[type] && !window[type].prototype.remove) {
      window[type].prototype.remove = remove;
    }
  }
}());
(function (root) {
  // Store setTimeout reference so promise-polyfill will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  const setTimeoutFunc = setTimeout;

  function noop() {}

  // Polyfill for Function.prototype.bind
  function bind(fn, thisArg) {
    return function () {
      fn.apply(thisArg, arguments);
    };
  }

  function Promise(fn) {
    if (_typeof(this) !== 'object') throw new TypeError('Promises must be constructed via new');
    if (typeof fn !== 'function') throw new TypeError('not a function');
    this._state = 0;
    this._handled = false;
    this._value = undefined;
    this._deferreds = [];

    doResolve(fn, this);
  }

  function handle(self, deferred) {
    while (self._state === 3) {
      self = self._value;
    }
    if (self._state === 0) {
      self._deferreds.push(deferred);
      return;
    }
    self._handled = true;
    Promise._immediateFn(() => {
      const cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
      if (cb === null) {
        (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
        return;
      }
      let ret;
      try {
        ret = cb(self._value);
      } catch (e) {
        reject(deferred.promise, e);
        return;
      }
      resolve(deferred.promise, ret);
    });
  }

  function resolve(self, newValue) {
    try {
      // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
      if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.');
      if (newValue && ((typeof newValue === 'undefined' ? 'undefined' : _typeof(newValue)) === 'object' || typeof newValue === 'function')) {
        const { then } = newValue;
        if (newValue instanceof Promise) {
          self._state = 3;
          self._value = newValue;
          finale(self);
          return;
        } if (typeof then === 'function') {
          doResolve(bind(then, newValue), self);
          return;
        }
      }
      self._state = 1;
      self._value = newValue;
      finale(self);
    } catch (e) {
      reject(self, e);
    }
  }

  function reject(self, newValue) {
    self._state = 2;
    self._value = newValue;
    finale(self);
  }

  function finale(self) {
    if (self._state === 2 && self._deferreds.length === 0) {
      Promise._immediateFn(() => {
        if (!self._handled) {
          Promise._unhandledRejectionFn(self._value);
        }
      });
    }

    for (let i = 0, len = self._deferreds.length; i < len; i++) {
      handle(self, self._deferreds[i]);
    }
    self._deferreds = null;
  }

  function Handler(onFulfilled, onRejected, promise) {
    this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
    this.onRejected = typeof onRejected === 'function' ? onRejected : null;
    this.promise = promise;
  }

  /**
     * Take a potentially misbehaving resolver function and make sure
     * onFulfilled and onRejected are only called once.
     *
     * Makes no guarantees about asynchrony.
     */
  function doResolve(fn, self) {
    let done = false;
    try {
      fn((value) => {
        if (done) return;
        done = true;
        resolve(self, value);
      }, (reason) => {
        if (done) return;
        done = true;
        reject(self, reason);
      });
    } catch (ex) {
      if (done) return;
      done = true;
      reject(self, ex);
    }
  }

  Promise.prototype.catch = function (onRejected) {
    return this.then(null, onRejected);
  };

  Promise.prototype.then = function (onFulfilled, onRejected) {
    const prom = new this.constructor(noop);

    handle(this, new Handler(onFulfilled, onRejected, prom));
    return prom;
  };

  Promise.all = function (arr) {
    const args = Array.prototype.slice.call(arr);

    return new Promise(((resolve, reject) => {
      if (args.length === 0) return resolve([]);
      let remaining = args.length;

      function res(i, val) {
        try {
          if (val && ((typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object' || typeof val === 'function')) {
            const { then } = val;
            if (typeof then === 'function') {
              then.call(val, (val) => {
                res(i, val);
              }, reject);
              return;
            }
          }
          args[i] = val;
          if (--remaining === 0) {
            resolve(args);
          }
        } catch (ex) {
          reject(ex);
        }
      }

      for (let i = 0; i < args.length; i++) {
        res(i, args[i]);
      }
    }));
  };

  Promise.resolve = function (value) {
    if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.constructor === Promise) {
      return value;
    }

    return new Promise(((resolve) => {
      resolve(value);
    }));
  };

  Promise.reject = function (value) {
    return new Promise(((resolve, reject) => {
      reject(value);
    }));
  };

  Promise.race = function (values) {
    return new Promise(((resolve, reject) => {
      for (let i = 0, len = values.length; i < len; i++) {
        values[i].then(resolve, reject);
      }
    }));
  };

  // Use polyfill for setImmediate for performance gains
  Promise._immediateFn = typeof setImmediate === 'function' && function (fn) {
    setImmediate(fn);
  } || function (fn) {
    setTimeoutFunc(fn, 0);
  };

  Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
    if (typeof console !== 'undefined' && console) {
      console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
    }
  };

  /**
     * Set the immediate function to execute callbacks
     * @param fn {function} Function to execute
     * @deprecated
     */
  Promise._setImmediateFn = function _setImmediateFn(fn) {
    Promise._immediateFn = fn;
  };

  /**
     * Change the function to execute on unhandled rejection
     * @param {function} fn Function to execute on unhandled rejection
     * @deprecated
     */
  Promise._setUnhandledRejectionFn = function _setUnhandledRejectionFn(fn) {
    Promise._unhandledRejectionFn = fn;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Promise;
  } else if (!root.Promise) {
    root.Promise = Promise;
  }
}(window));

/* global Promise */
(function (window) {
  if (!window.Promise) {
    window.Promise = Promise;
  }

  const RULE_REQUIRED = 'required';
  const RULE_EMAIL = 'email';
  const RULE_MINLENGTH = 'minLength';
  const RULE_MAXLENGTH = 'maxLength';
  const RULE_PASSWORD = 'password';
  const RULE_ZIP = 'zip';
  const RULE_PHONE = 'phone';
  const RULE_REMOTE = 'remote';
  const RULE_STRENGTH = 'strength';
  const RULE_FUNCTION = 'function';

  const formatParams = function formatParams(params, method) {
    if (typeof params === 'string') {
      return params;
    }

    const letter = method.toLowerCase() === 'post' ? '' : '?';
    if (Array.isArray(params)) {
      return letter + params.map((obj) => `${obj.name}=${obj.value}`).join('&');
    }
    return letter + Object.keys(params).map((key) => `${key}=${params[key]}`).join('&');
  };

  const ajax = function ajax(options) {
    const { url } = options;
    const { method } = options;
    const { data } = options;
    const { debug } = options;
    const { callback } = options;
    const { error } = options;

    if (debug) {
      callback('test');
      return;
    }

    const async = options.async !== false;
    const xhr = new XMLHttpRequest();
    let params = formatParams(data, 'get');
    let body = null;

    if (method.toLowerCase() === 'post') {
      body = formatParams(data, 'post');
      params = '';
    }

    xhr.open(method, url + params, async);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function () {
      if (this.readyState === 4) {
        if (this.status === 200) {
          callback(this.responseText);
        } else {
          error && error(this.responseText);
        }
      }
    };
    xhr.send(body);
  };

  const JustValidate = function JustValidate(selector, options) {
    this.options = options || {};
    this.rules = this.options.rules || {};
    this.messages = this.options.messages || undefined;
    this.colorWrong = this.options.colorWrong || '#B81111';
    this.result = {};
    this.elements = [];
    this.tooltip = this.options.tooltip || {};
    this.tooltipFadeOutTime = this.tooltip.fadeOutTime || 5000;
    this.tooltipFadeOutClass = this.tooltip.fadeOutClass || 'just-validate-tooltip-hide';
    this.tooltipSelectorWrap = document.querySelectorAll(this.tooltip.selectorWrap).length ? document.querySelectorAll(this.tooltip.selectorWrap) : document.querySelectorAll('.just-validate-tooltip-container');
    this.bindHandlerKeyup = this.handlerKeyup.bind(this);
    this.submitHandler = this.options.submitHandler || undefined;
    this.invalidFormCallback = this.options.invalidFormCallback || undefined;
    this.promisesRemote = [];
    this.isValidationSuccess = false;
    this.focusWrongField = this.options.focusWrongField || false;
    this.REGEXP = {
      // eslint-disable-next-line max-len
      email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      zip: /^\d{5}(-\d{4})?$/,
      phone: /^([0-9]( |-)?)?(\(?[0-9]{3}\)?|[0-9]{3})( |-)?([0-9]{3}( |-)?[0-9]{4}|[a-zA-Z0-9]{7})$/,
      password: /[^\w\d]*(([0-9]+.*[A-Za-z]+.*)|[A-Za-z]+.*([0-9]+.*))/,
      strengthPass: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]/,
    };
    this.DEFAULT_REMOTE_ERROR = 'Error';
    this.state = {
      tooltipsTimer: null,
    };

    this.setForm(document.querySelector(selector));
  };

  JustValidate.prototype = {
    defaultRules: {
      email: {
        required: true,
        email: true,
      },
      name: {
        required: true,
        minLength: 3,
        maxLength: 15,
      },
      text: {
        required: true,
        maxLength: 300,
        minLength: 5,
      },
      password: {
        required: true,
        password: true,
        minLength: 4,
        maxLength: 8,
      },
      zip: {
        required: true,
        zip: true,
      },
      phone: {
        phone: true,
      },
    },

    defaultMessages: {
      required: 'The field is required',
      email: 'Please, type a valid email',
      maxLength: 'The field must contain a maximum of :value characters',
      minLength: 'The field must contain a minimum of :value characters',
      password: 'Password is not valid',
      remote: 'Email already exists',
      strength: 'Password must contents at least one uppercase letter, one lowercase letter and one number',
      function: 'Function returned false',
    },

    /**
         * Keyup handler
         * @param ev
         */
    handlerKeyup: function handlerKeyup(ev) {
      const elem = ev.target;
      const item = {
        name: elem.getAttribute('data-validate-field'),
        value: elem.value,
      };
      delete this.result[item.name];
      this.validateItem({
        name: item.name,
        value: item.value,
        group: [],
        isKeyupChange: true,
      });
      this.renderErrors();
    },

    setterEventListener: function setterEventListener(item, event, handler, type) {
      if (event === 'keyup') {
        handler = this.bindHandlerKeyup;
      }
      switch (type) {
      case 'add':
      {
        item.addEventListener(event, handler);
        break;
      }
      case 'remove':
      {
        item.removeEventListener(event, handler);
        break;
      }
      }
    },

    getElementsRealValue: function getElementsRealValue() {
      const $elems = this.$form.querySelectorAll('*');
      let name = void 0;
      const result = {};
      for (let i = 0, len = $elems.length; i < len; ++i) {
        name = $elems[i].getAttribute('name');
        if (name) {
          if ($elems[i].type === 'checkbox') {
            result[name] = $elems[i].checked;
            continue;
          }
          result[name] = $elems[i].value;
        }
      }
      return result;
    },

    validationFailed: function validationFailed() {
      if (this.invalidFormCallback) {
        this.invalidFormCallback(this.result);
      }

      const $firstErrorField = document.querySelector('.js-validate-error-field');

      if (this.focusWrongField && $firstErrorField && $firstErrorField.focus) {
        $firstErrorField.focus();
      }
    },

    validationSuccess: function validationSuccess() {
      if (Object.keys(this.result).length === 0) {
        this.isValidationSuccess = false;
        if (this.submitHandler) {
          const realValues = this.getElementsRealValue();
          this.submitHandler(this.$form, realValues, ajax);
          return;
        }

        this.$form.submit();
      }
    },

    setForm: function setForm(form) {
      const _this = this;

      this.$form = form;
      this.$form.setAttribute('novalidate', 'novalidate');
      this.$form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        _this.result = [];
        _this.getElements();

        if (!_this.promisesRemote.length) {
          if (_this.isValidationSuccess) {
            _this.validationSuccess();
          } else {
            _this.validationFailed();
          }
          return;
        }

        Promise.all(_this.promisesRemote).then(() => {
          _this.promisesRemote = [];

          if (_this.isValidationSuccess) {
            _this.validationSuccess();
          } else {
            _this.validationFailed();
          }
        });
      });
    },

    isEmail: function isEmail(email) {
      return this.REGEXP.email.test(email);
    },

    isZip: function isZip(zip) {
      return this.REGEXP.zip.test(zip);
    },

    isPhone: function isPhone(phone) {
      return this.REGEXP.phone.test(phone);
    },

    isPassword: function isPassword(password) {
      return this.REGEXP.password.test(password);
    },

    isEmpty: function isEmpty(val) {
      let newVal = val;
      if (val.trim) {
        newVal = val.trim();
      }

      return !newVal;
    },

    checkLengthMax: function checkLengthMax(text, max) {
      return text.length <= max;
    },

    checkLengthMin: function checkLengthMin(text, min) {
      return text.length >= min;
    },

    checkStrengthPass: function checkStrengthPass(password) {
      return this.REGEXP.strengthPass.test(password);
    },

    getElements: function getElements() {
      const _this2 = this;

      const elems = this.$form.querySelectorAll('[data-validate-field]');
      this.elements = [];

      const _loop = function _loop(i, len) {
        const item = elems[i];
        const name = item.getAttribute('data-validate-field');
        let { value } = item;
        let isElemInGroup = false;
        const group = [];

        if (item.type === 'checkbox') {
          value = item.checked || '';
          item.addEventListener('change', (ev) => {
            const elem = ev.target;
            const item = {
              name: elem.getAttribute('data-validate-field'),
              value: elem.checked,
            };

            delete _this2.result[item.name];
            _this2.validateItem({
              name: item.name,
              value: item.value,
              group: [],
            });
            _this2.renderErrors();
          });
        }

        if (item.type === 'radio') {
          const findElem = _this2.elements.filter((item) => {
            if (item.name === name) {
              return item;
            }
          })[0];

          if (findElem) {
            findElem.group.push(item.checked);
            isElemInGroup = true;
          } else {
            group.push(item.checked);
          }

          item.addEventListener('change', (ev) => {
            const elem = ev.target;
            const item = {
              name: elem.getAttribute('data-validate-field'),
              value: elem.checked,
            };

            delete _this2.result[item.name];
            _this2.validateItem({
              name: item.name,
              value: item.value,
              group: [],
            });
            _this2.renderErrors();
          });
        }

        _this2.setterEventListener(item, 'keyup', _this2.handlerKeyup, 'add');

        if (!isElemInGroup) {
          _this2.elements.push({
            name,
            value,
            group,
          });
        }
      };

      for (let i = 0, len = elems.length; i < len; ++i) {
        _loop(i, len);
      }

      this.validateElements();
    },

    /**
         * Validate Required field
         * @param {string} value Value for validate
         * @returns {boolean} True if validate is OK
         */
    validateRequired: function validateRequired(value) {
      return !this.isEmpty(value);
    },

    /**
         * Validate Email field
         * @param {string} value Value for validate
         * @returns {boolean} True if validate is OK
         */
    validateEmail: function validateEmail(value) {
      return this.isEmail(value);
    },

    /**
         * Validate Phone field
         * @param {string} value Value for validate
         * @returns {boolean} True if validate is OK
         */
    validatePhone: function validatePhone(value) {
      return this.isPhone(value);
    },

    /**
         * Validate field for Min Length
         * @param {string} value Value for validate
         * @param {integer} min
         * @returns {boolean} True if validate is OK
         */
    validateMinLength: function validateMinLength(value, min) {
      return this.checkLengthMin(value, min);
    },

    /**
         * Validate field for Max Length
         * @param {string} value Value for validate
         * @param {integer} max
         * @returns {boolean} True if validate is OK
         */
    validateMaxLength: function validateMaxLength(value, max) {
      return this.checkLengthMax(value, max);
    },

    /**
         * Validate field for strength password
         * @param {string} password Value for validate
         * @returns {boolean} True if validate is OK
         */
    validateStrengthPass: function validateStrengthPass(password) {
      return this.checkStrengthPass(password);
    },

    /**
         * Validate Password field
         * @param {string} value Value for validate
         * @returns {boolean} True if validate is OK
         */
    validatePassword: function validatePassword(value) {
      return this.isPassword(value);
    },

    /**
         * Validate ZIP field
         * @param {string} value Value for validate
         * @returns {boolean} True if validate is OK
         */
    validateZip: function validateZip(value) {
      return this.isZip(value);
    },

    /**
         * Validate for remote check
         * @param value
         * @param name
         * @param {string} url
         * @param {string} successAnswer
         * @returns {boolean} True if validate is OK
         */
    validateRemote: function validateRemote(_ref) {
      const { value } = _ref;
      const { name } = _ref;
      const { url } = _ref;
      const { successAnswer } = _ref;
      const { sendParam } = _ref;
      const { method } = _ref;

      return new Promise(((resolve) => {
        ajax({
          url,
          method,
          data: _defineProperty({}, sendParam, value),
          async: true,
          callback: function callback(data) {
            if (data.toLowerCase() === successAnswer.toLowerCase()) {
              resolve('ok');
            }
            resolve({
              type: 'incorrect',
              name,
            });
          },
          error: function error() {
            resolve({
              type: 'error',
              name,
            });
          },
        });
      }));
    },

    generateMessage: function generateMessage(rule, name, value) {
      const messages = this.messages || this.defaultMessages;
      let customMessage = messages[name] && messages[name][rule] || this.messages && typeof this.messages[name] === 'string' && messages[name]
            // (messages[name][rule]) ||
            || this.defaultMessages[rule] || this.DEFAULT_REMOTE_ERROR;

      if (value) {
        customMessage = customMessage.replace(':value', value.toString());
      }
      this.result[name] = {
        message: customMessage,
      };
    },

    validateElements: function validateElements() {
      const _this3 = this;

      this.lockForm();
      this.elements.forEach((item) => {
        _this3.validateItem({
          name: item.name,
          value: item.value,
          group: item.group,
        });
      });

      if (!this.promisesRemote.length) {
        this.renderErrors();
        return;
      }

      Promise.all(this.promisesRemote).then((resp) => {
        resp.forEach((result) => {
          if (result === 'ok') {
            _this3.renderErrors();
            return;
          }
          if (result.type === 'error') {
            alert('Server error occured. Please try later.');
          }
          _this3.generateMessage(RULE_REMOTE, result.name);
          _this3.renderErrors();
        });
      });
    },

    validateItem: function validateItem(_ref2) {
      const _this4 = this;

      const { name } = _ref2;
      const { group } = _ref2;
      const { value } = _ref2;
      const { isKeyupChange } = _ref2;

      const rules = this.rules[name] || this.defaultRules[name] || false;

      if (!rules) {
        return;
      }
      for (const rule in rules) {
        const ruleValue = rules[rule];

        if (rule !== RULE_REQUIRED && rule !== RULE_FUNCTION && value == '') {
          return;
        }
        switch (rule) {
        case RULE_FUNCTION:
        {
          if (typeof ruleValue !== 'function') {
            break;
          }
          if (ruleValue(name, value)) {
            break;
          }
          this.generateMessage(RULE_FUNCTION, name, ruleValue);
          return;
        }
        case RULE_REQUIRED:
        {
          if (!ruleValue) {
            break;
          }

          if (group.length) {
            var isSuccessValidateGroup = false;

            // At least one item in group
            group.forEach((item) => {
              if (_this4.validateRequired(item)) {
                isSuccessValidateGroup = true;
              }
            });

            if (isSuccessValidateGroup) {
              break;
            }
          } else if (this.validateRequired(value)) {
            break;
          }

          this.generateMessage(RULE_REQUIRED, name);
          return;
        }

        case RULE_EMAIL:
        {
          if (!ruleValue) {
            break;
          }
          if (this.validateEmail(value)) {
            break;
          }
          this.generateMessage(RULE_EMAIL, name);
          return;
        }

        case RULE_MINLENGTH:
        {
          if (!ruleValue) {
            break;
          }
          if (this.validateMinLength(value, ruleValue)) {
            break;
          }
          this.generateMessage(RULE_MINLENGTH, name, ruleValue);
          return;
        }

        case RULE_MAXLENGTH:
        {
          if (!ruleValue) {
            break;
          }
          if (this.validateMaxLength(value, ruleValue)) {
            break;
          }
          this.generateMessage(RULE_MAXLENGTH, name, ruleValue);
          return;
        }

        case RULE_PHONE:
        {
          if (!ruleValue) {
            break;
          }
          if (this.validatePhone(value)) {
            break;
          }
          this.generateMessage(RULE_PHONE, name);
          return;
        }

        case RULE_PASSWORD:
        {
          if (!ruleValue) {
            break;
          }
          if (this.validatePassword(value)) {
            break;
          }
          this.generateMessage(RULE_PASSWORD, name);
          return;
        }

        case RULE_STRENGTH:
        {
          if (!ruleValue || (typeof ruleValue === 'undefined' ? 'undefined' : _typeof(ruleValue)) !== 'object') {
            break;
          }

          if (ruleValue.default && this.validateStrengthPass(value)) {
            break;
          }

          if (ruleValue.custom) {
            let regexp = void 0;

            try {
              regexp = new RegExp(ruleValue.custom);
            } catch (e) {
              regexp = this.REGEXP.strengthPass;

              // eslint-disable-next-line no-console
              console.error('Custom regexp for strength rule is not valid. Default regexp was used.');
            }

            if (regexp.test(value)) {
              break;
            }
          }
          this.generateMessage(RULE_STRENGTH, name);
          return;
        }

        case RULE_ZIP:
        {
          if (!ruleValue) {
            break;
          }
          if (this.validateZip(value)) {
            break;
          }
          this.generateMessage(RULE_ZIP, name);
          return;
        }

        case RULE_REMOTE:
        {
          if (isKeyupChange) {
            break;
          }

          if (!ruleValue) {
            break;
          }

          const { url } = ruleValue;
          const { successAnswer } = ruleValue;
          const { method } = ruleValue;
          const { sendParam } = ruleValue;

          const $elem = this.$form.querySelector(`input[data-validate-field="${name}"]`);
          this.setterEventListener($elem, 'keyup', this.handlerKeyup, 'remove');

          this.promisesRemote.push(this.validateRemote({
            name,
            value,
            url,
            method,
            sendParam,
            successAnswer,
          }));
          return;
        }
        }
      }
    },

    clearErrors: function clearErrors() {
      let $elems = document.querySelectorAll('.js-validate-error-label');
      for (let i = 0, len = $elems.length; i < len; ++i) {
        $elems[i].remove();
      }

      $elems = document.querySelectorAll('.js-validate-error-field');
      for (let _i = 0, _len = $elems.length; _i < _len; ++_i) {
        $elems[_i].classList.remove('js-validate-error-field');
        $elems[_i].style.border = '';
        $elems[_i].style.color = '';
      }
    },

    renderErrors: function renderErrors() {
      const _this5 = this;

      this.clearErrors();
      this.unlockForm();

      this.isValidationSuccess = false;
      if (Object.keys(this.result).length === 0) {
        this.isValidationSuccess = true;
        return;
      }

      for (const _item in this.result) {
        const { message } = this.result[_item];
        const $elems = this.$form.querySelectorAll(`[data-validate-field="${_item}"]`);

        const $elem = $elems[$elems.length - 1];

        const div = document.createElement('div');

        div.innerHTML = message;
        div.className = 'js-validate-error-label';
        div.setAttribute('style', `color: ${this.colorWrong}`);
        $elem.style.border = `1px solid ${this.colorWrong}`;
        $elem.style.color = `${this.colorWrong}`;
        $elem.classList.add('js-validate-error-field');

        if ($elem.type === 'checkbox' || $elem.type === 'radio') {
          const $label = document.querySelector(`label[for="${$elem.getAttribute('id')}"]`);

          if ($elem.parentNode.tagName.toLowerCase() === 'label') {
            $elem.parentNode.parentNode.insertBefore(div, null);
          } else if ($label) {
            $label.parentNode.insertBefore(div, $label.nextSibling);
          } else {
            $elem.parentNode.insertBefore(div, $elem.nextSibling);
          }
        } else {
          $elem.parentNode.insertBefore(div, $elem.nextSibling);
        }
      }

      if (!this.tooltipSelectorWrap.length) {
        return;
      }

      this.state.tooltipsTimer = setTimeout(() => {
        _this5.hideTooltips();
      }, this.tooltipFadeOutTime);
    },

    hideTooltips: function hideTooltips() {
      const _this6 = this;

      const $elemsErrorLabel = document.querySelectorAll('.js-validate-error-label');

      $elemsErrorLabel.forEach((item) => {
        item.classList.add(_this6.tooltipFadeOutClass);
      });

      this.state.tooltipsTimer = null;
    },

    lockForm: function lockForm() {
      const $elems = this.$form.querySelectorAll('input, textarea, button, select');
      for (let i = 0, len = $elems.length; i < len; ++i) {
        $elems[i].setAttribute('disabled', 'disabled');
        $elems[i].style.pointerEvents = 'none';
        $elems[i].style.webitFilter = 'grayscale(100%)';
        $elems[i].style.filter = 'grayscale(100%)';
      }
    },

    unlockForm: function unlockForm() {
      const $elems = this.$form.querySelectorAll('input, textarea, button, select');
      for (let i = 0, len = $elems.length; i < len; ++i) {
        $elems[i].removeAttribute('disabled');
        $elems[i].style.pointerEvents = '';
        $elems[i].style.webitFilter = '';
        $elems[i].style.filter = '';
      }
    },
  };

  window.JustValidate = JustValidate;
}(window));
