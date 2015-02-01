var PhysicsRenderer = function(renderer, shader, size) {

    // PRIVATE VARS

    var _this = this;

    var _renderer = renderer;
    var _size = size;

    var _target1, _target2, _target3, _outTargetPtr;
    var _resetPass, _simPass, _debugPass;

    var _registeredUniforms = [];

    var _currUpdateTarget;

    // PRIVATE FUNCTIONS

    var _checkSupport = function() {
        var gl = renderer.context;

        if ( gl.getExtension( "OES_texture_float" ) === null ) {
            console.error("PhysicsRenderer: OES_texture_float not supported.");
            return;
        }

        if ( gl.getParameter( gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS ) === 0 ) {
            console.error("PhysicsRenderer: Vertex shader textures not supported.");
            return;
        }
    };

    var _updateRegisteredUniforms = function() {
        for (var i=0; i<_registeredUniforms.length; i++) {
            _registeredUniforms[i].value = _outTargetPtr;
        }
    };

    // PUBLIC FUNCTIONS

    this.update = function(dt, t) {
        _simPass.material.uniforms.uDeltaT.value = dt;
        _simPass.material.uniforms.uTime.value = t;

        if (_currUpdateTarget === 1) {
            _simPass.material.uniforms.tPrev.value = _target2;
            _simPass.material.uniforms.tCurr.value = _target3;
            _simPass.render(_renderer, _target1);
            _outTargetPtr = _target1;
        }
        else if (_currUpdateTarget === 2) {
            _simPass.material.uniforms.tPrev.value = _target3;
            _simPass.material.uniforms.tCurr.value = _target1;
            _simPass.render(_renderer, _target2);
            _outTargetPtr = _target2;
        }
        else if (_currUpdateTarget === 3) {
            _simPass.material.uniforms.tPrev.value = _target1;
            _simPass.material.uniforms.tCurr.value = _target2;
            _simPass.render(_renderer, _target3);
            _outTargetPtr = _target3;
        }
        else {
            console.error("PhysicsRenderer: something's wrong!");
        }

        // _debugPass.render(_renderer);

        // update uniforms
        _updateRegisteredUniforms();

        // increment target
        _currUpdateTarget++;
        if (_currUpdateTarget > 3)
            _currUpdateTarget = 1;
    };

    this.registerUniform = function(uniform) {
        _registeredUniforms.push(uniform);
        uniform.value = _outTargetPtr;
    };

    this.getUniforms = function() {
        return _simPass.material.uniforms;
    };

    this.reset = function() {
        _resetPass.render(_renderer, _target1);
        _resetPass.render(_renderer, _target2);
        _resetPass.render(_renderer, _target3);
    };

    // INITIALIZATION

    _checkSupport();

    // init targets

    _target1 = new THREE.WebGLRenderTarget(_size, _size, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        depthBuffer: false,
        stencilBuffer: false
    });
    _target1.generateMipmaps = false;
    _target2 = _target1.clone();
    _target3 = _target1.clone();

    _currUpdateTarget = 1;
    _outTargetPtr = _target1;

    // init shader pass

    _simPass = new ShaderPass(shader);
    _resetPass = new ShaderPass(PassShader);
    _debugPass = new ShaderPass(SimDebugShader);
    _debugPass.material.uniforms.tTarget1.value = _target1;
    _debugPass.material.uniforms.tTarget2.value = _target2;
    _debugPass.material.uniforms.tTarget3.value = _target3;

    this.reset();   // reset targets

    // _debugPass.render(_renderer);

};

PhysicsRenderer.prototype.constructor = PhysicsRenderer;