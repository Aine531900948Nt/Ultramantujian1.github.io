// 动态加载Bmob SDK
function loadBmobSDK() {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载
    if (window.Bmob) {
      resolve();
      return;
    }
    
    // 创建script标签加载Bmob SDK
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/bmob@2.2.10/dist/Bmob-2.2.10.min.js';
    script.onload = () => {
      console.log('Bmob SDK加载成功');
      resolve();
    };
    script.onerror = () => {
      console.error('Bmob SDK加载失败');
      reject(new Error('Bmob SDK加载失败'));
    };
    document.head.appendChild(script);
  });
}

// 应用配置
const appConfig = {
  bmobAppId: "您的Application ID",
  bmobRestApiKey: "您的REST API Key",
  useLocalStorageFallback: true // 当Bmob不可用时使用本地存储
};

let ultramans = [];
let currentEditIndex = -1;
let isBmobAvailable = false;

// DOM元素加载完成后初始化应用
document.addEventListener('DOMContentLoaded', function() {
  // 先尝试加载Bmob SDK，再初始化应用
  loadBmobSDK()
    .then(() => {
      // 初始化Bmob
      Bmob.initialize(appConfig.bmobAppId, appConfig.bmobRestApiKey);
      isBmobAvailable = true;
      console.log('Bmob初始化成功');
    })
    .catch(error => {
      console.warn('Bmob不可用，将使用本地存储:', error);
      isBmobAvailable = false;
      if (!appConfig.useLocalStorageFallback) {
        alert('数据存储服务不可用，应用可能无法正常工作');
      }
    })
    .finally(() => {
      // 无论Bmob是否可用，都初始化应用
      initApp();
      setupEventListeners();
    });
});

// 应用初始化
function initApp() {
  // 根据Bmob是否可用选择加载方式
  if (isBmobAvailable) {
    loadUltramansFromBmob();
    // 每30秒自动刷新一次数据，保持同步
    setInterval(loadUltramansFromBmob, 30000);
  } else if (appConfig.useLocalStorageFallback) {
    loadUltramansFromLocalStorage();
  }
  
  renderUltramanGrid();
  renderPowerRankings();
}

// 设置事件监听器
function setupEventListeners() {
  // 添加奥特曼按钮事件
  document.getElementById('addUltramanBtn').addEventListener('click', function() {
    currentEditIndex = -1;
    resetUltramanForm();
    document.getElementById('ultramanModal').classList.remove('hidden');
  });
  
  // 表单提交事件
  document.getElementById('ultramanForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveUltramanForm();
  });
  
  // 关闭模态框事件
  document.getElementById('closeModal').addEventListener('click', function() {
    document.getElementById('ultramanModal').classList.add('hidden');
  });
  
  // 搜索功能事件
  document.getElementById('searchInput').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    filterUltramans(searchTerm);
  });
  
  // 时代筛选事件
  document.getElementById('eraFilter').addEventListener('change', function(e) {
    const era = e.target.value;
    filterByEra(era);
  });
}

// 从Bmob数据库加载奥特曼数据
function loadUltramansFromBmob() {
  if (!isBmobAvailable) return;
  
  const Ultraman = Bmob.Object.extend("Ultraman");
  const query = new Bmob.Query(Ultraman);
  
  query.find({
    success: function(results) {
      // 转换Bmob对象为普通JavaScript对象
      ultramans = results.map(item => ({
        id: item.id,
        name: item.get('name'),
        era: item.get('era'),
        gender: item.get('gender'),
        birthPlace: item.get('birthPlace'),
        race: item.get('race'),
        debutYear: item.get('debutYear'),
        avatarUrl: item.get('avatarUrl'),
        imageUrl: item.get('imageUrl'),
        power: item.get('power') || 0,
        forms: item.get('forms') || []
      }));
      
      // 同时保存到本地存储作为备份
      saveUltramansToLocalStorage();
      
      // 刷新页面显示
      renderUltramanGrid();
      renderPowerRankings();
      console.log("数据已从Bmob同步");
    },
    error: function(error) {
      console.error("从Bmob加载数据失败：", error);
      // 失败时使用本地存储备份
      loadUltramansFromLocalStorage();
    }
  });
}

// 从本地存储加载数据
function loadUltramansFromLocalStorage() {
  const localData = localStorage.getItem('ultramans');
  if (localData) {
    try {
      ultramans = JSON.parse(localData);
      renderUltramanGrid();
      renderPowerRankings();
      console.log("数据已从本地存储加载");
    } catch (e) {
      console.error("解析本地存储数据失败：", e);
      ultramans = [];
    }
  }
}

// 保存数据到本地存储
function saveUltramansToLocalStorage() {
  try {
    localStorage.setItem('ultramans', JSON.stringify(ultramans));
    console.log("数据已保存到本地存储");
  } catch (e) {
    console.error("保存到本地存储失败：", e);
  }
}

// 保存数据到Bmob数据库或本地存储
function saveUltramans() {
  // 始终保存到本地存储作为备份
  saveUltramansToLocalStorage();
  
  // 如果Bmob可用，同步到Bmob
  if (isBmobAvailable) {
    const Ultraman = Bmob.Object.extend("Ultraman");
    const query = new Bmob.Query(Ultraman);
    
    // 先清空现有数据
    query.destroyAll({
      success: function() {
        // 批量保存新数据
        const batch = new Bmob.Batch();
        
        ultramans.forEach(ultraman => {
          const obj = new Ultraman();
          if (ultraman.id) {
            obj.set('objectId', ultraman.id);
          }
          
          // 设置所有字段
          obj.set('name', ultraman.name);
          obj.set('era', ultraman.era);
          obj.set('gender', ultraman.gender);
          obj.set('birthPlace', ultraman.birthPlace);
          obj.set('race', ultraman.race);
          obj.set('debutYear', ultraman.debutYear);
          obj.set('avatarUrl', ultraman.avatarUrl);
          obj.set('imageUrl', ultraman.imageUrl);
          obj.set('power', ultraman.power);
          obj.set('forms', ultraman.forms);
          
          batch.save(obj);
        });
        
        // 提交批量操作
        batch.commit().then(() => {
          console.log("数据已成功同步到Bmob");
          // 同步成功后重新加载数据以获取最新的ID
          loadUltramansFromBmob();
        }).catch(error => {
          console.error("同步到Bmob失败：", error);
          alert("数据同步到云端失败，但已保存到本地");
        });
      },
      error: function(error) {
        console.error("清空Bmob旧数据失败：", error);
        alert("更新云端数据失败，但已保存到本地");
      }
    });
  } else if (appConfig.useLocalStorageFallback) {
    // 仅使用本地存储时，刷新界面
    renderUltramanGrid();
    renderPowerRankings();
    alert("数据已保存到本地");
  }
}

// 渲染奥特曼网格
function renderUltramanGrid() {
  const gridContainer = document.getElementById('ultramanGrid');
  gridContainer.innerHTML = '';
  
  if (ultramans.length === 0) {
    gridContainer.innerHTML = '<p class="text-center text-gray-500">暂无奥特曼数据，请添加新的奥特曼</p>';
    return;
  }
  
  ultramans.forEach((ultraman, index) => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105';
    card.innerHTML = `
      <div class="relative">
        <img src="${ultraman.imageUrl || 'default-ultraman.jpg'}" alt="${ultraman.name}" class="w-full h-48 object-cover">
        <div class="absolute top-2 right-2 flex space-x-1">
          <button onclick="editUltraman(${index})" class="bg-yellow-500 p-1 rounded-full text-white hover:bg-yellow-600">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteUltraman('${ultraman.id}')" class="bg-red-500 p-1 rounded-full text-white hover:bg-red-600">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="p-4">
        <h3 class="text-xl font-bold text-gray-800">${ultraman.name}</h3>
        <p class="text-gray-600">${ultraman.era} · ${ultraman.debutYear}年</p>
        <div class="mt-2 flex justify-between items-center">
          <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">战斗力: ${ultraman.power}</span>
          <button onclick="viewUltramanDetails('${ultraman.id}')" class="text-indigo-600 hover:text-indigo-800 text-sm">
            查看详情 <i class="fas fa-arrow-right ml-1"></i>
          </button>
        </div>
      </div>
    `;
    gridContainer.appendChild(card);
  });
}

// 渲染实力排行榜
function renderPowerRankings() {
  const rankingsContainer = document.getElementById('powerRankings');
  rankingsContainer.innerHTML = '';
  
  // 按战斗力排序
  const sortedUltramans = [...ultramans].sort((a, b) => b.power - a.power).slice(0, 5);
  
  sortedUltramans.forEach((ultraman, index) => {
    const item = document.createElement('div');
    item.className = `flex items-center p-2 ${index === 0 ? 'bg-yellow-50' : index === 1 ? 'bg-gray-50' : index === 2 ? 'bg-amber-50' : 'bg-white'}`;
    item.innerHTML = `
      <div class="w-8 h-8 flex items-center justify-center rounded-full ${index === 0 ? 'bg-yellow-100 text-yellow-600' : index === 1 ? 'bg-gray-100 text-gray-600' : index === 2 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'} font-bold">
        ${index + 1}
      </div>
      <img src="${ultraman.avatarUrl || 'default-avatar.jpg'}" alt="${ultraman.name}" class="w-10 h-10 rounded-full mx-3 object-cover">
      <span class="flex-grow font-medium">${ultraman.name}</span>
      <span class="text-red-600 font-bold">${ultraman.power}</span>
    `;
    rankingsContainer.appendChild(item);
  });
}

// 重置奥特曼表单
function resetUltramanForm() {
  document.getElementById('ultramanForm').reset();
  document.getElementById('formTitle').textContent = '添加新奥特曼';
  document.getElementById('formsContainer').innerHTML = '';
  addFormField(); // 添加一个形态字段
}

// 保存奥特曼表单数据
function saveUltramanForm() {
  const name = document.getElementById('name').value;
  const era = document.getElementById('era').value;
  const gender = document.getElementById('gender').value;
  const birthPlace = document.getElementById('birthPlace').value;
  const race = document.getElementById('race').value;
  const debutYear = document.getElementById('debutYear').value;
  const avatarUrl = document.getElementById('avatarUrl').value;
  const imageUrl = document.getElementById('imageUrl').value;
  const power = parseInt(document.getElementById('power').value) || 0;
  
  // 收集形态数据
  const formFields = document.querySelectorAll('.form-field');
  const forms = Array.from(formFields).map(field => ({
    name: field.querySelector('.form-name').value,
    power: parseInt(field.querySelector('.form-power').value) || 0
  })).filter(form => form.name.trim() !== '');
  
  if (!name || !era || !debutYear) {
    alert('请填写必要的信息（名称、时代、登场年份）');
    return;
  }
  
  const ultramanData = {
    name,
    era,
    gender,
    birthPlace,
    race,
    debutYear,
    avatarUrl,
    imageUrl,
    power,
    forms
  };
  
  if (currentEditIndex === -1) {
    // 添加新奥特曼
    ultramans.push(ultramanData);
  } else {
    // 更新现有奥特曼，保留ID
    ultramanData.id = ultramans[currentEditIndex].id;
    ultramans[currentEditIndex] = ultramanData;
  }
  
  // 保存数据并刷新界面
  saveUltramans();
  document.getElementById('ultramanModal').classList.add('hidden');
}

// 编辑奥特曼
function editUltraman(index) {
  currentEditIndex = index;
  const ultraman = ultramans[index];
  
  // 填充表单
  document.getElementById('name').value = ultraman.name || '';
  document.getElementById('era').value = ultraman.era || '';
  document.getElementById('gender').value = ultraman.gender || '';
  document.getElementById('birthPlace').value = ultraman.birthPlace || '';
  document.getElementById('race').value = ultraman.race || '';
  document.getElementById('debutYear').value = ultraman.debutYear || '';
  document.getElementById('avatarUrl').value = ultraman.avatarUrl || '';
  document.getElementById('imageUrl').value = ultraman.imageUrl || '';
  document.getElementById('power').value = ultraman.power || 0;
  document.getElementById('formTitle').textContent = '编辑奥特曼';
  
  // 填充形态数据
  const formsContainer = document.getElementById('formsContainer');
  formsContainer.innerHTML = '';
  
  if (ultraman.forms && ultraman.forms.length > 0) {
    ultraman.forms.forEach(form => {
      addFormField(form.name, form.power);
    });
  } else {
    addFormField();
  }
  
  document.getElementById('ultramanModal').classList.remove('hidden');
}

// 删除奥特曼
function deleteUltraman(id) {
  if (confirm('确定要删除这个奥特曼吗？')) {
    ultramans = ultramans.filter(ultraman => ultraman.id !== id);
    saveUltramans(); // 同步数据
  }
}

// 查看奥特曼详情
function viewUltramanDetails(id) {
  const ultraman = ultramans.find(u => u.id === id);
  if (!ultraman) return;
  
  const detailsContainer = document.getElementById('ultramanDetails');
  detailsContainer.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="detailsOverlay">
      <div class="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div class="relative">
          <img src="${ultraman.imageUrl || 'default-ultraman.jpg'}" alt="${ultraman.name}" class="w-full h-64 object-cover">
          <button onclick="closeDetails()" class="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="p-6">
          <h2 class="text-3xl font-bold mb-4">${ultraman.name}</h2>
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p class="text-gray-600">时代</p>
              <p class="font-medium">${ultraman.era}</p>
            </div>
            <div>
              <p class="text-gray-600">登场年份</p>
              <p class="font-medium">${ultraman.debutYear}</p>
            </div>
            <div>
              <p class="text-gray-600">出生地</p>
              <p class="font-medium">${ultraman.birthPlace}</p>
            </div>
            <div>
              <p class="text-gray-600">种族</p>
              <p class="font-medium">${ultraman.race}</p>
            </div>
            <div>
              <p class="text-gray-600">性别</p>
              <p class="font-medium">${ultraman.gender}</p>
            </div>
            <div>
              <p class="text-gray-600">战斗力</p>
              <p class="font-medium text-red-600">${ultraman.power}</p>
            </div>
          </div>
          
          ${ultraman.forms && ultraman.forms.length > 0 ? `
            <div class="mb-6">
              <h3 class="text-xl font-bold mb-3">形态</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${ultraman.forms.map(form => `
                  <div class="bg-gray-50 p-3 rounded-lg">
                    <div class="flex justify-between items-center">
                      <span class="font-medium">${form.name}</span>
                      <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">战斗力: ${form.power}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <button onclick="editUltraman(${ultramans.findIndex(u => u.id === id)})" class="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 mr-2">
            <i class="fas fa-edit mr-1"></i> 编辑
          </button>
          <button onclick="deleteUltraman('${ultraman.id}'); closeDetails()" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            <i class="fas fa-trash mr-1"></i> 删除
          </button>
        </div>
      </div>
    </div>
  `;
}

// 关闭详情页
function closeDetails() {
  document.getElementById('ultramanDetails').innerHTML = '';
}

// 添加形态字段
function addFormField(name = '', power = 0) {
  const formsContainer = document.getElementById('formsContainer');
  const field = document.createElement('div');
  field.className = 'form-field flex gap-2 mb-2';
  field.innerHTML = `
    <input type="text" placeholder="形态名称" value="${name}" class="form-name flex-grow p-2 border rounded">
    <input type="number" placeholder="战斗力" value="${power}" class="form-power w-32 p-2 border rounded">
    <button type="button" onclick="this.parentElement.remove()" class="bg-gray-200 p-2 rounded hover:bg-gray-300">
      <i class="fas fa-times"></i>
    </button>
  `;
  formsContainer.appendChild(field);
}

// 筛选奥特曼
function filterUltramans(searchTerm) {
  const filtered = ultramans.filter(ultraman => 
    ultraman.name.toLowerCase().includes(searchTerm) || 
    ultraman.era.toLowerCase().includes(searchTerm) ||
    ultraman.race.toLowerCase().includes(searchTerm)
  );
  
  renderFilteredGrid(filtered);
}

// 按时代筛选
function filterByEra(era) {
  if (era === 'all') {
    renderUltramanGrid();
    return;
  }
  
  const filtered = ultramans.filter(ultraman => ultraman.era === era);
  renderFilteredGrid(filtered);
}

// 渲染筛选后的网格
function renderFilteredGrid(filteredUltramans) {
  const gridContainer = document.getElementById('ultramanGrid');
  gridContainer.innerHTML = '';
  
  if (filteredUltramans.length === 0) {
    gridContainer.innerHTML = '<p class="text-center text-gray-500">没有找到匹配的奥特曼</p>';
    return;
  }
  
  filteredUltramans.forEach((ultraman) => {
    // 与renderUltramanGrid相同的卡片渲染逻辑
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105';
    card.innerHTML = `
      <div class="relative">
        <img src="${ultraman.imageUrl || 'default-ultraman.jpg'}" alt="${ultraman.name}" class="w-full h-48 object-cover">
        <div class="absolute top-2 right-2 flex space-x-1">
          <button onclick="editUltraman(${ultramans.findIndex(u => u.id === ultraman.id)})" class="bg-yellow-500 p-1 rounded-full text-white hover:bg-yellow-600">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteUltraman('${ultraman.id}')" class="bg-red-500 p-1 rounded-full text-white hover:bg-red-600">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="p-4">
        <h3 class="text-xl font-bold text-gray-800">${ultraman.name}</h3>
        <p class="text-gray-600">${ultraman.era} · ${ultraman.debutYear}年</p>
        <div class="mt-2 flex justify-between items-center">
          <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">战斗力: ${ultraman.power}</span>
          <button onclick="viewUltramanDetails('${ultraman.id}')" class="text-indigo-600 hover:text-indigo-800 text-sm">
            查看详情 <i class="fas fa-arrow-right ml-1"></i>
          </button>
        </div>
      </div>
    `;
    gridContainer.appendChild(card);
  });
}

// 暴露函数到全局，确保HTML中的事件可以调用
window.editUltraman = editUltraman;
window.deleteUltraman = deleteUltraman;
window.viewUltramanDetails = viewUltramanDetails;
window.closeDetails = closeDetails;
window.addFormField = addFormField;
