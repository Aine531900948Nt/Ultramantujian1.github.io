// 全局变量
let ultramans = [];
let isDeveloperMode = false;
let currentCroppingTarget = null;
let cropper = null;
let isEditing = false;
let currentEditingId = null;

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    // 登录逻辑
    const loginModal = document.getElementById('loginModal');
    const appContent = document.getElementById('appContent');
    const guestLogin = document.getElementById('guestLogin');
    const developerLogin = document.getElementById('developerLogin');
    const passwordContainer = document.getElementById('passwordContainer');
    const passwordInput = document.getElementById('passwordInput');
    const submitPassword = document.getElementById('submitPassword');
    const devModeToggle = document.getElementById('devModeToggle');
    const toggleDevModeBtn = document.getElementById('toggleDevMode');
    
    // 开发者密码默认为88888888
    const DEVELOPER_PASSWORD = '88888888';
    
    // 游客登录
    guestLogin.addEventListener('click', function() {
        isDeveloperMode = false;
        loginModal.style.display = 'none';
        appContent.style.display = 'block';
        devModeToggle.style.display = 'none';
        document.getElementById('addUltramanSection').style.display = 'none';
        document.getElementById('homeAddBtnContainer').style.display = 'none';
        initApp();
    });
    
    // 开发者登录
    developerLogin.addEventListener('click', function() {
        passwordContainer.style.display = 'block';
    });
    
    // 提交密码
    submitPassword.addEventListener('click', function() {
        if (passwordInput.value === DEVELOPER_PASSWORD) {
            isDeveloperMode = true;
            loginModal.style.display = 'none';
            appContent.style.display = 'block';
            devModeToggle.style.display = 'block';
            document.getElementById('addUltramanSection').style.display = 'block';
            document.getElementById('homeAddBtnContainer').style.display = 'block';
            initApp();
        } else {
            alert('密码错误，请重新输入');
        }
    });
    
    // 切换开发者模式
    toggleDevModeBtn.addEventListener('click', function() {
        isDeveloperMode = !isDeveloperMode;
        toggleDevModeBtn.textContent = isDeveloperMode ? '开发者模式已启用' : '开发者模式已禁用';
        document.getElementById('addUltramanSection').style.display = isDeveloperMode ? 'block' : 'none';
        document.getElementById('homeAddBtnContainer').style.display = isDeveloperMode ? 'block' : 'none';
    });
    
    // 导航切换
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有活跃状态
            navLinks.forEach(l => l.classList.remove('active'));
            pages.forEach(page => page.classList.remove('active'));
            
            // 添加当前活跃状态
            this.classList.add('active');
            const targetPage = document.querySelector(this.getAttribute('href'));
            targetPage.classList.add('active');
        });
    });
    
    // 搜索功能
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // 图片裁剪相关
    const cropModal = document.getElementById('cropModal');
    const cropImage = document.getElementById('cropImage');
    const confirmCrop = document.getElementById('confirmCrop');
    const cancelCrop = document.getElementById('cancelCrop');
    const closeCropModal = cropModal.querySelector('.close-btn');
    
    // 确认裁剪
    confirmCrop.addEventListener('click', function() {
        if (cropper && currentCroppingTarget) {
            const croppedCanvas = cropper.getCroppedCanvas();
            const croppedImageUrl = croppedCanvas.toDataURL('image/jpeg');
            
            // 更新预览图
            if (currentCroppingTarget.type === 'ultraman') {
                if (currentCroppingTarget.imageType === 'avatar') {
                    document.getElementById('ultramanAvatarPreview').src = croppedImageUrl;
                } else {
                    document.getElementById('ultramanImagePreview').src = croppedImageUrl;
                }
            } else if (currentCroppingTarget.type === 'form') {
                const formIndex = currentCroppingTarget.formIndex;
                const formContainer = document.querySelector(`[data-form-index="${formIndex}"]`);
                if (currentCroppingTarget.imageType === 'avatar') {
                    formContainer.querySelector('.avatar-preview').src = croppedImageUrl;
                } else {
                    formContainer.querySelector('.image-preview').src = croppedImageUrl;
                }
            }
            
            // 销毁裁剪实例并关闭模态框
            cropper.destroy();
            cropModal.style.display = 'none';
            currentCroppingTarget = null;
        }
    });
    
    // 取消裁剪
    cancelCrop.addEventListener('click', function() {
        if (cropper) {
            cropper.destroy();
        }
        cropModal.style.display = 'none';
        currentCroppingTarget = null;
    });
    
    // 关闭裁剪模态框
    closeCropModal.addEventListener('click', function() {
        if (cropper) {
            cropper.destroy();
        }
        cropModal.style.display = 'none';
        currentCroppingTarget = null;
    });
    
    // 选择奥特曼全身照
    document.getElementById('selectUltramanImage').addEventListener('click', function() {
        document.getElementById('ultramanImage').click();
    });
    
    // 选择奥特曼头像
    document.getElementById('selectUltramanAvatar').addEventListener('click', function() {
        document.getElementById('ultramanAvatar').click();
    });
    
    // 从全身照截取头像
    document.getElementById('cropFromFullImage').addEventListener('click', function() {
        const fullImageUrl = document.getElementById('ultramanImagePreview').src;
        if (fullImageUrl && !fullImageUrl.includes('via.placeholder.com')) {
            openCropModal(fullImageUrl, { type: 'ultraman', imageType: 'avatar' });
        } else {
            alert('请先选择全身照');
        }
    });
    
    // 奥特曼全身照选择处理
    document.getElementById('ultramanImage').addEventListener('change', function(e) {
        handleImageSelection(e, { type: 'ultraman', imageType: 'full' });
    });
    
    // 奥特曼头像选择处理
    document.getElementById('ultramanAvatar').addEventListener('change', function(e) {
        handleImageSelection(e, { type: 'ultraman', imageType: 'avatar' });
    });
    
    // 形态图片选择处理 - 使用事件委托
    document.getElementById('formsContainer').addEventListener('click', function(e) {
        if (e.target.classList.contains('select-form-image')) {
            const formContainer = e.target.closest('.form-section-container');
            const formIndex = formContainer.getAttribute('data-form-index');
            const fileInput = formContainer.querySelector('input[type="file"][accept="image/*"]:first-of-type');
            fileInput.click();
            
            // 存储当前形态索引
            fileInput.setAttribute('data-form-index', formIndex);
            fileInput.setAttribute('data-image-type', 'full');
        } else if (e.target.classList.contains('select-form-avatar')) {
            const formContainer = e.target.closest('.form-section-container');
            const formIndex = formContainer.getAttribute('data-form-index');
            const fileInputs = formContainer.querySelectorAll('input[type="file"][accept="image/*"]');
            const avatarInput = fileInputs[1];
            avatarInput.click();
            
            // 存储当前形态索引
            avatarInput.setAttribute('data-form-index', formIndex);
            avatarInput.setAttribute('data-image-type', 'avatar');
        } else if (e.target.classList.contains('crop-form-from-full')) {
            const formContainer = e.target.closest('.form-section-container');
            const formIndex = formContainer.getAttribute('data-form-index');
            const fullImageUrl = formContainer.querySelector('.image-preview').src;
            
            if (fullImageUrl && !fullImageUrl.includes('via.placeholder.com')) {
                openCropModal(fullImageUrl, { type: 'form', formIndex: formIndex, imageType: 'avatar' });
            } else {
                alert('请先选择全身照');
            }
        }
    });
    
    // 形态图片选择处理
    document.getElementById('formsContainer').addEventListener('change', function(e) {
        if (e.target.type === 'file') {
            const formIndex = e.target.getAttribute('data-form-index');
            const imageType = e.target.getAttribute('data-image-type');
            handleImageSelection(e, { type: 'form', formIndex: formIndex, imageType: imageType });
        }
    });
    
    // 显示/隐藏表单
    document.getElementById('toggleFormBtn').addEventListener('click', function() {
        const formContainer = document.getElementById('ultramanFormContainer');
        const isVisible = formContainer.style.display !== 'none';
        formContainer.style.display = isVisible ? 'none' : 'block';
        this.textContent = isVisible ? '显示表单' : '隐藏表单';
    });
    
    // 首页添加按钮
    document.getElementById('homeAddBtn').addEventListener('click', function() {
        resetForm();
        const formContainer = document.getElementById('ultramanFormContainer');
        formContainer.style.display = 'block';
        document.getElementById('toggleFormBtn').textContent = '隐藏表单';
        // 滚动到表单位置
        document.getElementById('addUltramanSection').scrollIntoView({ behavior: 'smooth' });
    });
    
    // 添加形态按钮
    document.getElementById('addFormBtn').addEventListener('click', function() {
        addFormSection();
    });
    
    // 表单提交
    document.getElementById('ultramanForm').addEventListener('submit', function(e) {
        e.preventDefault();
        if (isEditing) {
            updateUltraman(currentEditingId);
        } else {
            saveUltraman();
        }
    });
    
    // 图片查看模态框
    const imageViewerModal = document.getElementById('imageViewerModal');
    const largeImage = document.getElementById('largeImage');
    const closeImageViewer = imageViewerModal.querySelector('.close-btn');
    
    closeImageViewer.addEventListener('click', function() {
        imageViewerModal.style.display = 'none';
    });
    
    // 点击模态框背景关闭大图查看
    imageViewerModal.addEventListener('click', function(e) {
        if (e.target === imageViewerModal) {
            imageViewerModal.style.display = 'none';
        }
    });
    
    // 奥特曼详情模态框
    const ultramanModal = document.getElementById('ultramanModal');
    const closeUltramanModal = ultramanModal.querySelector('.close-btn');
    
    closeUltramanModal.addEventListener('click', function() {
        ultramanModal.style.display = 'none';
    });
});

// 初始化应用
function initApp() {
    // 从本地存储加载数据
    loadUltramans();
    
    // 渲染奥特曼卡片
    renderUltramanGrid();
    
    // 渲染战力排行
    renderPowerRankings();
}

// 打开裁剪模态框
function openCropModal(imageUrl, target) {
    currentCroppingTarget = target;
    const cropImage = document.getElementById('cropImage');
    cropImage.src = imageUrl;
    
    // 显示裁剪模态框
    document.getElementById('cropModal').style.display = 'block';
    
    // 初始化裁剪器
    setTimeout(() => {
        if (cropper) {
            cropper.destroy();
        }
        cropper = new Cropper(cropImage, {
            aspectRatio: 1, // 头像是正方形
            viewMode: 1,
            guides: true,
            center: true,
            autoCropArea: 0.8,
            responsive: true
        });
    }, 100);
}

// 处理图片选择和裁剪
function handleImageSelection(event, target) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        if (target.imageType === 'avatar') {
            // 对于头像，直接打开裁剪模态框
            openCropModal(e.target.result, target);
        } else {
            // 对于全身照，直接设置预览
            if (target.type === 'ultraman') {
                document.getElementById('ultramanImagePreview').src = e.target.result;
            } else if (target.type === 'form') {
                const formContainer = document.querySelector(`[data-form-index="${target.formIndex}"]`);
                formContainer.querySelector('.image-preview').src = e.target.result;
            }
        }
    };
    reader.readAsDataURL(file);
}

// 添加形态表单
function addFormSection() {
    const formsContainer = document.getElementById('formsContainer');
    const formCount = formsContainer.children.length;
    const formIndex = formCount;
    
    const formSection = document.createElement('div');
    formSection.className = 'form-section-container';
    formSection.setAttribute('data-form-index', formIndex);
    
    formSection.innerHTML = `
        <div class="form-section-title">
            <h4>形态 ${formCount}</h4>
            <button type="button" class="remove-form-btn">删除</button>
        </div>
        
        <div class="image-upload-group">
            <div class="image-upload">
                <h5>全身照</h5>
                <img src="https://via.placeholder.com/200x250/e2e8f0/4a5568?text=形态全身照" class="image-preview" alt="形态全身照预览">
                <input type="file" accept="image/*" style="display: none;" data-form-index="${formIndex}" data-image-type="full">
                <button type="button" class="btn btn-secondary select-form-image">选择全身照</button>
            </div>
            <div class="image-upload">
                <h5>头像</h5>
                <img src="https://via.placeholder.com/150x150/e2e8f0/4a5568?text=形态头像" class="avatar-preview" alt="形态头像预览">
                <input type="file" accept="image/*" style="display: none;" data-form-index="${formIndex}" data-image-type="avatar">
                <button type="button" class="btn btn-secondary select-form-avatar">选择头像</button>
                <button type="button" class="btn btn-secondary crop-form-from-full">从全身照截取</button>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>形态名称 *</label>
                <input type="text" class="form-name-input" required>
            </div>
            <div class="form-group">
                <label>战力等级 *</label>
                <select class="form-power-level-input" required>
                    <option value="">请选择</option>
                    <option value="T0">T0</option>
                    <option value="T1">T1</option>
                    <option value="T2">T2</option>
                    <option value="T3">T3</option>
                    <option value="T4">T4</option>
                </select>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>身高</label>
                <input type="text" class="form-height-input">
            </div>
            <div class="form-group">
                <label>体重</label>
                <input type="text" class="form-weight-input">
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>飞行速度</label>
                <input type="text" class="form-flight-speed-input">
            </div>
            <div class="form-group">
                <label>行走速度</label>
                <input type="text" class="form-running-speed-input">
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>水中速度</label>
                <input type="text" class="form-swimming-speed-input">
            </div>
            <div class="form-group">
                <label>跳跃力</label>
                <input type="text" class="form-jumping-power-input">
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>腕力</label>
                <input type="text" class="form-arm-strength-input">
            </div>
            <div class="form-group">
                <label>握力</label>
                <input type="text" class="form-grip-strength-input">
            </div>
        </div>
        
        <div class="form-group">
            <label>必杀技</label>
            <textarea class="form-skills-input"></textarea>
        </div>
        
        <div class="form-group">
            <label>形态描述</label>
            <textarea class="form-description-input"></textarea>
        </div>
    `;
    
    formsContainer.appendChild(formSection);
    
    // 添加删除事件
    const removeBtn = formSection.querySelector('.remove-form-btn');
    removeBtn.addEventListener('click', function() {
        formsContainer.removeChild(formSection);
    });
}

// 重置表单
function resetForm() {
    isEditing = false;
    currentEditingId = null;
    document.getElementById('saveUltramanBtn').textContent = '保存奥特曼信息';
    
    // 重置形态表单
    const formsContainer = document.getElementById('formsContainer');
    formsContainer.innerHTML = `
        <div class="form-section-container" data-form-index="0">
            <h4>基础形态</h4>
            
            <div class="image-upload-group">
                <div class="image-upload">
                    <h5>全身照</h5>
                    <img id="baseFormImagePreview" src="https://via.placeholder.com/200x250/e2e8f0/4a5568?text=基础形态全身照" class="image-preview" alt="基础形态全身照预览">
                    <input type="file" id="baseFormImage" accept="image/*" style="display: none;">
                    <button type="button" class="btn btn-secondary select-form-image">选择全身照</button>
                </div>
                <div class="image-upload">
                    <h5>头像</h5>
                    <img id="baseFormAvatarPreview" src="https://via.placeholder.com/150x150/e2e8f0/4a5568?text=基础形态头像" class="avatar-preview" alt="基础形态头像预览">
                    <input type="file" id="baseFormAvatar" accept="image/*" style="display: none;">
                    <button type="button" class="btn btn-secondary select-form-avatar">选择头像</button>
                    <button type="button" class="btn btn-secondary crop-form-from-full">从全身照截取</button>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="baseFormName">形态名称 *</label>
                    <input type="text" id="baseFormName" required>
                </div>
                <div class="form-group">
                    <label for="baseFormPowerLevel">战力等级 *</label>
                    <select id="baseFormPowerLevel" required>
                        <option value="">请选择</option>
                        <option value="T0">T0</option>
                        <option value="T1">T1</option>
                        <option value="T2">T2</option>
                        <option value="T3">T3</option>
                        <option value="T4">T4</option>
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="baseFormHeight">身高</label>
                    <input type="text" id="baseFormHeight">
                </div>
                <div class="form-group">
                    <label for="baseFormWeight">体重</label>
                    <input type="text" id="baseFormWeight">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="baseFormFlightSpeed">飞行速度</label>
                    <input type="text" id="baseFormFlightSpeed">
                </div>
                <div class="form-group">
                    <label for="baseFormRunningSpeed">行走速度</label>
                    <input type="text" id="baseFormRunningSpeed">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="baseFormSwimmingSpeed">水中速度</label>
                    <input type="text" id="baseFormSwimmingSpeed">
                </div>
                <div class="form-group">
                    <label for="baseFormJumpingPower">跳跃力</label>
                    <input type="text" id="baseFormJumpingPower">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="baseFormArmStrength">腕力</label>
                    <input type="text" id="baseFormArmStrength">
                </div>
                <div class="form-group">
                    <label for="baseFormGripStrength">握力</label>
                    <input type="text" id="baseFormGripStrength">
                </div>
            </div>
            
            <div class="form-group">
                <label for="baseFormSkills">必杀技</label>
                <textarea id="baseFormSkills"></textarea>
            </div>
            
            <div class="form-group">
                <label for="baseFormDescription">形态描述</label>
                <textarea id="baseFormDescription"></textarea>
            </div>
        </div>
    `;
}

// 保存奥特曼信息
function saveUltraman() {
    // 获取基本信息
    const ultraman = {
        id: `ultra-${Date.now()}`,
        name: document.getElementById('ultramanName').value,
        era: document.getElementById('ultramanEra').value,
        gender: document.getElementById('ultramanGender').value,
        age: document.getElementById('ultramanAge').value,
        birthPlace: document.getElementById('ultramanBirthPlace').value,
        race: document.getElementById('ultramanRace').value,
        debutYear: document.getElementById('ultramanDebutYear').value,
        appearance: document.getElementById('ultramanAppearance').value,
        humanForm: document.getElementById('ultramanHumanForm').value,
        transformer: document.getElementById('ultramanTransformer').value,
        description: document.getElementById('ultramanDescription').value,
        imageUrl: document.getElementById('ultramanImagePreview').src,
        avatarUrl: document.getElementById('ultramanAvatarPreview').src,
        
        // 新增物理属性
        height: document.getElementById('ultramanHeight').value,
        weight: document.getElementById('ultramanWeight').value,
        flightSpeed: document.getElementById('ultramanFlightSpeed').value,
        runningSpeed: document.getElementById('ultramanRunningSpeed').value,
        swimmingSpeed: document.getElementById('ultramanSwimmingSpeed').value,
        jumpingPower: document.getElementById('ultramanJumpingPower').value,
        armStrength: document.getElementById('ultramanArmStrength').value,
        gripStrength: document.getElementById('ultramanGripStrength').value,
        skills: document.getElementById('ultramanSkills').value,
        
        forms: []
    };
    
    // 获取所有形态信息
    const formContainers = document.querySelectorAll('.form-section-container');
    formContainers.forEach(container => {
        const formIndex = container.getAttribute('data-form-index');
        const form = {
            name: container.querySelector('.form-name-input') ? container.querySelector('.form-name-input').value : document.getElementById('baseFormName').value,
            powerLevel: container.querySelector('.form-power-level-input') ? container.querySelector('.form-power-level-input').value : document.getElementById('baseFormPowerLevel').value,
            
            // 形态物理属性
            height: container.querySelector('.form-height-input') ? container.querySelector('.form-height-input').value : document.getElementById('baseFormHeight').value,
            weight: container.querySelector('.form-weight-input') ? container.querySelector('.form-weight-input').value : document.getElementById('baseFormWeight').value,
            flightSpeed: container.querySelector('.form-flight-speed-input') ? container.querySelector('.form-flight-speed-input').value : document.getElementById('baseFormFlightSpeed').value,
            runningSpeed: container.querySelector('.form-running-speed-input') ? container.querySelector('.form-running-speed-input').value : document.getElementById('baseFormRunningSpeed').value,
            swimmingSpeed: container.querySelector('.form-swimming-speed-input') ? container.querySelector('.form-swimming-speed-input').value : document.getElementById('baseFormSwimmingSpeed').value,
            jumpingPower: container.querySelector('.form-jumping-power-input') ? container.querySelector('.form-jumping-power-input').value : document.getElementById('baseFormJumpingPower').value,
            armStrength: container.querySelector('.form-arm-strength-input') ? container.querySelector('.form-arm-strength-input').value : document.getElementById('baseFormArmStrength').value,
            gripStrength: container.querySelector('.form-grip-strength-input') ? container.querySelector('.form-grip-strength-input').value : document.getElementById('baseFormGripStrength').value,
            
            skills: container.querySelector('.form-skills-input') ? container.querySelector('.form-skills-input').value : document.getElementById('baseFormSkills').value,
            description: container.querySelector('.form-description-input') ? container.querySelector('.form-description-input').value : document.getElementById('baseFormDescription').value,
            imageUrl: container.querySelector('.image-preview').src,
            avatarUrl: container.querySelector('.avatar-preview').src
        };
        
        ultraman.forms.push(form);
    });
    
    // 添加到数组并保存
    ultramans.push(ultraman);
    saveUltramans();
    
    // 更新UI
    renderUltramanGrid();
    renderPowerRankings();
    
    // 重置表单
    document.getElementById('ultramanForm').reset();
    document.getElementById('ultramanImagePreview').src = 'https://via.placeholder.com/200x250/e2e8f0/4a5568?text=奥特曼全身照';
    document.getElementById('ultramanAvatarPreview').src = 'https://via.placeholder.com/150x150/e2e8f0/4a5568?text=奥特曼头像';
    
    resetForm();
    
    alert('奥特曼信息保存成功！');
}

// 渲染奥特曼网格
function renderUltramanGrid() {
    const grid = document.getElementById('ultramanGrid');
    grid.innerHTML = '';
    
    // 应用筛选器
    const eraFilter = document.getElementById('eraFilter').value;
    const genderFilter = document.getElementById('genderFilter').value;
    const birthPlaceFilter = document.getElementById('birthPlaceFilter').value;
    const raceFilter = document.getElementById('raceFilter').value;
    const sortFilter = document.getElementById('sortFilter').value;
    
    // 筛选奥特曼
    let filteredUltramans = [...ultramans];
    
    if (eraFilter !== 'all') {
        filteredUltramans = filteredUltramans.filter(u => u.era === eraFilter);
    }
    
    if (genderFilter !== 'all') {
        filteredUltramans = filteredUltramans.filter(u => u.gender === genderFilter);
    }
    
    if (birthPlaceFilter !== 'all') {
        filteredUltramans = filteredUltramans.filter(u => u.birthPlace === birthPlaceFilter);
    }
    
    if (raceFilter !== 'all') {
        filteredUltramans = filteredUltramans.filter(u => u.race === raceFilter);
    }
    
    // 排序
    if (sortFilter === 'debutYear') {
        filteredUltramans.sort((a, b) => a.debutYear - b.debutYear);
    } else if (sortFilter === 'name') {
        filteredUltramans.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // 创建卡片
    filteredUltramans.forEach(ultraman => {
        const card = document.createElement('div');
        card.className = 'ultraman-card';
        card.innerHTML = `
            <img src="${ultraman.avatarUrl}" alt="${ultraman.name}" class="ultraman-img" data-id="${ultraman.id}">
            <div class="ultraman-info">
                <h3 class="ultraman-name">${ultraman.name}</h3>
                <p class="ultraman-era">${ultraman.era} · ${ultraman.debutYear}年登场</p>
                ${ultraman.forms && ultraman.forms.length > 1 ? `<p class="ultraman-forms">${ultraman.forms.length} 种形态</p>` : ''}
            </div>
        `;
        
        // 点击卡片查看详情
        card.addEventListener('click', function(e) {
            if (!e.target.classList.contains('ultraman-img')) {
                showUltramanDetails(ultraman.id);
            }
        });
        
        // 点击图片查看大图
        const img = card.querySelector('.ultraman-img');
        img.addEventListener('click', function(e) {
            e.stopPropagation();
            showLargeImage(ultraman.avatarUrl);
        });
        
        grid.appendChild(card);
    });
}

// 渲染战力排行 - 修改头像为方形
function renderPowerRankings() {
    // 按战力等级分组
    const tiers = {
        T0: [],
        T1: [],
        T2: [],
        T3: [],
        T4: []
    };
    
    ultramans.forEach(ultraman => {
        // 使用第一个形态的战力等级
        if (ultraman.forms && ultraman.forms.length > 0) {
            const tier = ultraman.forms[0].powerLevel;
            if (tiers[tier]) {
                tiers[tier].push(ultraman);
            }
        }
    });
    
    // 渲染各等级
    for (const tier in tiers) {
        const container = document.getElementById(`tier${tier.charAt(1)}Grid`);
        container.innerHTML = '';
        
        tiers[tier].forEach(ultraman => {
            const card = document.createElement('div');
            card.className = 'ranking-card';
            // 使用第一个形态的头像
            const formAvatar = ultraman.forms && ultraman.forms.length > 0 ? ultraman.forms[0].avatarUrl : ultraman.avatarUrl;
            card.innerHTML = `
                <img src="${formAvatar}" alt="${ultraman.name}" data-id="${ultraman.id}" class="ranking-avatar">
                <h4>${ultraman.name}</h4>
                <p>${ultraman.forms && ultraman.forms.length > 0 ? ultraman.forms[0].name : '基础形态'}</p>
            `;
            
            // 点击卡片查看详情
            card.addEventListener('click', function(e) {
                if (e.target.tagName !== 'IMG') {
                    showUltramanDetails(ultraman.id);
                }
            });
            
            // 点击图片查看大图
            const img = card.querySelector('img');
            img.addEventListener('click', function(e) {
                e.stopPropagation();
                showLargeImage(formAvatar);
            });
            
            container.appendChild(card);
        });
    }
}

// 显示奥特曼详情
function showUltramanDetails(id) {
    const ultraman = ultramans.find(u => u.id === id);
    if (!ultraman) return;
    
    const modalTitle = document.getElementById('modalUltramanName');
    const detailsContainer = document.getElementById('ultramanDetails');
    
    modalTitle.textContent = ultraman.name;
    
    // 生成形态信息HTML
    let formsHTML = '';
    if (ultraman.forms && ultraman.forms.length > 0) {
        formsHTML = `
            <h3>形态信息</h3>
            <div class="forms-grid">
                ${ultraman.forms.map(form => `
                    <div class="form-card">
                        <img src="${form.avatarUrl}" alt="${form.name}">
                        <h4>${form.name}</h4>
                        <p>战力等级: ${form.powerLevel}</p>
                        <p>${form.height || '未知'} / ${form.weight || '未知'}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    detailsContainer.innerHTML = `
        <div style="display: flex; flex-wrap: wrap; gap: 30px;">
            <div style="flex: 1; min-width: 250px;">
                <img src="${ultraman.imageUrl}" alt="${ultraman.name}" style="width: 100%; border-radius: 10px;">
            </div>
            <div style="flex: 2; min-width: 300px;">
                <h3>基本信息</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; width: 30%;"><strong>年代</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${ultraman.era}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>性别</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${ultraman.gender}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>年龄</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${ultraman.age || '未知'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>出生地</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${ultraman.birthPlace}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>种族</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${ultraman.race || '未知'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>首次登场</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${ultraman.debutYear}年 (${ultraman.appearance || '未知'})</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>人间体</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${ultraman.humanForm || '未知'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>变身器</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${ultraman.transformer || '未知'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>身高</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${ultraman.height || '未知'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>体重</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${ultraman.weight || '未知'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>飞行速度</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${ultraman.flightSpeed || '未知'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>行走速度</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${ultraman.runningSpeed || '未知'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>水中速度</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${ultraman.swimmingSpeed || '未知'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>跳跃力</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${ultraman.jumpingPower || '未知'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>腕力</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${ultraman.armStrength || '未知'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>握力</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${ultraman.gripStrength || '未知'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>技能</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${ultraman.skills || '未知'}</td>
                    </tr>
                </table>
                
                ${formsHTML}
                
                <h3>角色介绍</h3>
                <p style="line-height: 1.6;">${ultraman.description || '暂无数据'}</p>
                
                ${isDeveloperMode ? `
                    <div class="edit-buttons">
                        <button class="edit-btn" onclick="editUltraman('${ultraman.id}')">编辑信息</button>
                        <button class="delete-btn" onclick="deleteUltraman('${ultraman.id}')">删除奥特曼</button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('ultramanModal').style.display = 'block';
}

// 编辑奥特曼信息
function editUltraman(id) {
    const ultraman = ultramans.find(u => u.id === id);
    if (!ultraman) return;
    
    isEditing = true;
    currentEditingId = id;
    document.getElementById('saveUltramanBtn').textContent = '更新奥特曼信息';
    
    // 填充表单数据
    document.getElementById('ultramanName').value = ultraman.name;
    document.getElementById('ultramanEra').value = ultraman.era;
    document.getElementById('ultramanGender').value = ultraman.gender;
    document.getElementById('ultramanAge').value = ultraman.age || '';
    document.getElementById('ultramanBirthPlace').value = ultraman.birthPlace;
    document.getElementById('ultramanRace').value = ultraman.race || '';
    document.getElementById('ultramanDebutYear').value = ultraman.debutYear;
    document.getElementById('ultramanAppearance').value = ultraman.appearance || '';
    document.getElementById('ultramanHumanForm').value = ultraman.humanForm || '';
    document.getElementById('ultramanTransformer').value = ultraman.transformer || '';
    document.getElementById('ultramanDescription').value = ultraman.description || '';
    document.getElementById('ultramanImagePreview').src = ultraman.imageUrl;
    document.getElementById('ultramanAvatarPreview').src = ultraman.avatarUrl;
    
    // 填充物理属性
    document.getElementById('ultramanHeight').value = ultraman.height || '';
    document.getElementById('ultramanWeight').value = ultraman.weight || '';
    document.getElementById('ultramanFlightSpeed').value = ultraman.flightSpeed || '';
    document.getElementById('ultramanRunningSpeed').value = ultraman.runningSpeed || '';
    document.getElementById('ultramanSwimmingSpeed').value = ultraman.swimmingSpeed || '';
    document.getElementById('ultramanJumpingPower').value = ultraman.jumpingPower || '';
    document.getElementById('ultramanArmStrength').value = ultraman.armStrength || '';
    document.getElementById('ultramanGripStrength').value = ultraman.gripStrength || '';
    document.getElementById('ultramanSkills').value = ultraman.skills || '';
    
    // 填充形态信息
    const formsContainer = document.getElementById('formsContainer');
    formsContainer.innerHTML = '';
    
    if (ultraman.forms && ultraman.forms.length > 0) {
        ultraman.forms.forEach((form, index) => {
            const formSection = document.createElement('div');
            formSection.className = 'form-section-container';
            formSection.setAttribute('data-form-index', index);
            
            formSection.innerHTML = `
                <div class="form-section-title">
                    <h4>${index === 0 ? '基础形态' : '形态 ' + (index + 1)}</h4>
                    ${index > 0 ? '<button type="button" class="remove-form-btn">删除</button>' : ''}
                </div>
                
                <div class="image-upload-group">
                    <div class="image-upload">
                        <h5>全身照</h5>
                        <img src="${form.imageUrl}" class="image-preview" alt="形态全身照预览">
                        <input type="file" accept="image/*" style="display: none;" data-form-index="${index}" data-image-type="full">
                        <button type="button" class="btn btn-secondary select-form-image">选择全身照</button>
                    </div>
                    <div class="image-upload">
                        <h5>头像</h5>
                        <img src="${form.avatarUrl}" class="avatar-preview" alt="形态头像预览">
                        <input type="file" accept="image/*" style="display: none;" data-form-index="${index}" data-image-type="avatar">
                        <button type="button" class="btn btn-secondary select-form-avatar">选择头像</button>
                        <button type="button" class="btn btn-secondary crop-form-from-full">从全身照截取</button>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>形态名称 *</label>
                        <input type="text" class="form-name-input" value="${form.name}" required>
                    </div>
                    <div class="form-group">
                        <label>战力等级 *</label>
                        <select class="form-power-level-input" required>
                            <option value="">请选择</option>
                            <option value="T0" ${form.powerLevel === 'T0' ? 'selected' : ''}>T0</option>
                            <option value="T1" ${form.powerLevel === 'T1' ? 'selected' : ''}>T1</option>
                            <option value="T2" ${form.powerLevel === 'T2' ? 'selected' : ''}>T2</option>
                            <option value="T3" ${form.powerLevel === 'T3' ? 'selected' : ''}>T3</option>
                            <option value="T4" ${form.powerLevel === 'T4' ? 'selected' : ''}>T4</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>身高</label>
                        <input type="text" class="form-height-input" value="${form.height || ''}">
                    </div>
                    <div class="form-group">
                        <label>体重</label>
                        <input type="text" class="form-weight-input" value="${form.weight || ''}">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>飞行速度</label>
                        <input type="text" class="form-flight-speed-input" value="${form.flightSpeed || ''}">
                    </div>
                    <div class="form-group">
                        <label>行走速度</label>
                        <input type="text" class="form-running-speed-input" value="${form.runningSpeed || ''}">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>水中速度</label>
                        <input type="text" class="form-swimming-speed-input" value="${form.swimmingSpeed || ''}">
                    </div>
                    <div class="form-group">
                        <label>跳跃力</label>
                        <input type="text" class="form-jumping-power-input" value="${form.jumpingPower || ''}">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>腕力</label>
                        <input type="text" class="form-arm-strength-input" value="${form.armStrength || ''}">
                    </div>
                    <div class="form-group">
                        <label>握力</label>
                        <input type="text" class="form-grip-strength-input" value="${form.gripStrength || ''}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>必杀技</label>
                    <textarea class="form-skills-input">${form.skills || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label>形态描述</label>
                    <textarea class="form-description-input">${form.description || ''}</textarea>
                </div>
            `;
            
            formsContainer.appendChild(formSection);
            
            // 添加删除事件
            if (index > 0) {
                const removeBtn = formSection.querySelector('.remove-form-btn');
                removeBtn.addEventListener('click', function() {
                    formsContainer.removeChild(formSection);
                });
            }
        });
    }
    
    // 显示表单
    document.getElementById('ultramanFormContainer').style.display = 'block';
    document.getElementById('toggleFormBtn').textContent = '隐藏表单';
    
    // 滚动到表单
    document.getElementById('addUltramanSection').scrollIntoView({ behavior: 'smooth' });
    
    // 关闭详情模态框
    document.getElementById('ultramanModal').style.display = 'none';
}

// 更新奥特曼信息
function updateUltraman(id) {
    const ultramanIndex = ultramans.findIndex(u => u.id === id);
    if (ultramanIndex === -1) return;
    
    // 获取更新后的信息
    const updatedUltraman = {
        id: id,
        name: document.getElementById('ultramanName').value,
        era: document.getElementById('ultramanEra').value,
        gender: document.getElementById('ultramanGender').value,
        age: document.getElementById('ultramanAge').value,
        birthPlace: document.getElementById('ultramanBirthPlace').value,
        race: document.getElementById('ultramanRace').value,
        debutYear: document.getElementById('ultramanDebutYear').value,
        appearance: document.getElementById('ultramanAppearance').value,
        humanForm: document.getElementById('ultramanHumanForm').value,
        transformer: document.getElementById('ultramanTransformer').value,
        description: document.getElementById('ultramanDescription').value,
        imageUrl: document.getElementById('ultramanImagePreview').src,
        avatarUrl: document.getElementById('ultramanAvatarPreview').src,
        
        // 物理属性
        height: document.getElementById('ultramanHeight').value,
        weight: document.getElementById('ultramanWeight').value,
        flightSpeed: document.getElementById('ultramanFlightSpeed').value,
        runningSpeed: document.getElementById('ultramanRunningSpeed').value,
        swimmingSpeed: document.getElementById('ultramanSwimmingSpeed').value,
        jumpingPower: document.getElementById('ultramanJumpingPower').value,
        armStrength: document.getElementById('ultramanArmStrength').value,
        gripStrength: document.getElementById('ultramanGripStrength').value,
        skills: document.getElementById('ultramanSkills').value,
        
        forms: []
    };
    
    // 获取所有形态信息
    const formContainers = document.querySelectorAll('.form-section-container');
    formContainers.forEach(container => {
        const form = {
            name: container.querySelector('.form-name-input').value,
            powerLevel: container.querySelector('.form-power-level-input').value,
            
            // 形态物理属性
            height: container.querySelector('.form-height-input').value,
            weight: container.querySelector('.form-weight-input').value,
            flightSpeed: container.querySelector('.form-flight-speed-input').value,
            runningSpeed: container.querySelector('.form-running-speed-input').value,
            swimmingSpeed: container.querySelector('.form-swimming-speed-input').value,
            jumpingPower: container.querySelector('.form-jumping-power-input').value,
            armStrength: container.querySelector('.form-arm-strength-input').value,
            gripStrength: container.querySelector('.form-grip-strength-input').value,
            
            skills: container.querySelector('.form-skills-input').value,
            description: container.querySelector('.form-description-input').value,
            imageUrl: container.querySelector('.image-preview').src,
            avatarUrl: container.querySelector('.avatar-preview').src
        };
        
        updatedUltraman.forms.push(form);
    });
    
    // 更新数组并保存
    ultramans[ultramanIndex] = updatedUltraman;
    saveUltramans();
    
    // 更新UI
    renderUltramanGrid();
    renderPowerRankings();
    
    alert('奥特曼信息更新成功！');
    
    resetForm();
}

// 删除奥特曼
function deleteUltraman(id) {
    if (confirm('确定要删除这个奥特曼吗？此操作不可撤销！')) {
        ultramans = ultramans.filter(u => u.id !== id);
        saveUltramans();
        
        // 更新UI
        renderUltramanGrid();
        renderPowerRankings();
        
        // 关闭详情模态框
        document.getElementById('ultramanModal').style.display = 'none';
        
        alert('奥特曼删除成功！');
    }
}

// 显示大图
function showLargeImage(url) {
    document.getElementById('largeImage').src = url;
    document.getElementById('imageViewerModal').style.display = 'block';
}

// 搜索功能
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!searchTerm) {
        renderUltramanGrid();
        return;
    }
    
    const grid = document.getElementById('ultramanGrid');
    grid.innerHTML = '';
    
    let foundResults = false;
    
    ultramans.forEach(ultraman => {
        // 检查奥特曼名称和形态名称是否匹配搜索词
        const nameMatch = ultraman.name.toLowerCase().includes(searchTerm);
        
        let formMatch = false;
        if (ultraman.forms) {
            formMatch = ultraman.forms.some(form => 
                form.name.toLowerCase().includes(searchTerm)
            );
        }
        
        if (nameMatch || formMatch) {
            foundResults = true;
            const card = document.createElement('div');
            card.className = 'ultraman-card';
            card.innerHTML = `
                <img src="${ultraman.avatarUrl}" alt="${ultraman.name}" class="ultraman-img" data-id="${ultraman.id}">
                <div class="ultraman-info">
                    <h3 class="ultraman-name">${ultraman.name}</h3>
                    <p class="ultraman-era">${ultraman.era} · ${ultraman.debutYear}年登场</p>
                    ${ultraman.forms && ultraman.forms.length > 1 ? `<p class="ultraman-forms">${ultraman.forms.length} 种形态</p>` : ''}
                    ${formMatch ? `<p class="search-match">匹配形态: ${ultraman.forms.filter(f => f.name.toLowerCase().includes(searchTerm)).map(f => f.name).join(', ')}</p>` : ''}
                </div>
            `;
            
            // 点击卡片查看详情
            card.addEventListener('click', function(e) {
                if (!e.target.classList.contains('ultraman-img')) {
                    showUltramanDetails(ultraman.id);
                }
            });
            
            // 点击图片查看大图
            const img = card.querySelector('.ultraman-img');
            img.addEventListener('click', function(e) {
                e.stopPropagation();
                showLargeImage(ultraman.avatarUrl);
            });
            
            grid.appendChild(card);
        }
    });
    
    if (!foundResults) {
        grid.innerHTML = '<div class="no-results"><p>没有找到匹配的奥特曼或形态</p></div>';
    }
}

// 本地存储相关
function saveUltramans() {
    localStorage.setItem('ultramans', JSON.stringify(ultramans));
}

function loadUltramans() {
    const saved = localStorage.getItem('ultramans');
    // 清除所有默认奥特曼信息，只保留空数组
    ultramans = saved ? JSON.parse(saved) : [];
}

// 筛选器变化事件
document.getElementById('eraFilter').addEventListener('change', renderUltramanGrid);
document.getElementById('genderFilter').addEventListener('change', renderUltramanGrid);
document.getElementById('birthPlaceFilter').addEventListener('change', renderUltramanGrid);
document.getElementById('raceFilter').addEventListener('change', renderUltramanGrid);
document.getElementById('sortFilter').addEventListener('change', renderUltramanGrid);