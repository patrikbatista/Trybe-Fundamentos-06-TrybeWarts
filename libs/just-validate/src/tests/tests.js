describe('Validate rules', () => {
  describe('isEmail', () => {
    const validate = new window.JustValidate('.js-form');

    it('test@test.com - correct', () => {
      assert.isTrue(validate.validateEmail('test@test.com'));
    });
    it('ivan@gmail.com - correct', () => {
      assert.isTrue(validate.validateEmail('ivan@gmail.com'));
    });
    it('ivangmail.com - wrong', () => {
      assert.isFalse(validate.validateEmail('ivangmail.com'));
    });
    it('ivan@gmailcom - wrong', () => {
      assert.isFalse(validate.validateEmail('ivan@gmailcom'));
    });
    it('ivan@ - wrong', () => {
      assert.isFalse(validate.validateEmail('ivan@'));
    });
  });

  describe('isZip', () => {
    const validate = new window.JustValidate('.js-form');

    it('12345 - correct', () => {
      assert.isTrue(validate.validateZip('12345'));
    });
    it('55555 - correct', () => {
      assert.isTrue(validate.validateZip('55555'));
    });
    it('12345678 - wrong', () => {
      assert.isFalse(validate.validateZip('12345678'));
    });
    it('fdsdf - wrong', () => {
      assert.isFalse(validate.validateZip('fdsdf'));
    });
  });

  describe('isPhone', () => {
    const validate = new window.JustValidate('.js-form');

    it('111-222-3333 - correct', () => {
      assert.isTrue(validate.validatePhone('111-222-3333'));
    });
    it('55555 - wrong', () => {
      assert.isFalse(validate.validatePhone('55555'));
    });
  });

  describe('isPassword', () => {
    const validate = new window.JustValidate('.js-form');

    it('12345f - correct', () => {
      assert.isTrue(validate.validatePassword('12345f'));
    });
    it('sdfgs1 - correct', () => {
      assert.isTrue(validate.validatePassword('sdfgs1'));
    });
    it('55555 - wrong', () => {
      assert.isFalse(validate.validatePassword('55555'));
    });
    it('dsgsdf - wrong', () => {
      assert.isFalse(validate.validatePassword('dsgsdf'));
    });
  });

  describe('isMinLength', () => {
    const validate = new window.JustValidate('.js-form');

    it('1111 (length 3) - correct', () => {
      assert.isTrue(validate.validateMinLength('1111', 3));
    });
    it('1234 (length 5) - wrong', () => {
      assert.isFalse(validate.validateMinLength('1234', 5));
    });
  });

  describe('isMaxLength', () => {
    const validate = new window.JustValidate('.js-form');

    it('123456 (length 8) - correct', () => {
      assert.isTrue(validate.validateMaxLength('123456', 8));
    });
    it('123456 (length 5) - wrong', () => {
      assert.isFalse(validate.validateMaxLength('123456', 5));
    });
  });
});
