const map = new maplibregl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/basic/style.json?key=u9MyF029tt9j0DTj88NX',
    center: [106.322609, 20.896930], 


    zoom: 6.5
  });
  
  map.on('load', () => {
    const layers = map.getStyle().layers;
    
    // Ẩn toàn bộ lớp mặc định
    layers.forEach(layer => map.setLayoutProperty(layer.id, 'visibility', 'none'));
  
    // Hiện các lớp mong muốn
    ['road', 'building', 'water', 'landcover'].forEach(key => {
      layers.forEach(layer => {
        if (layer.id.includes(key)) {
          map.setLayoutProperty(layer.id, 'visibility', 'visible');
        }
      });
    });
    layers.forEach(layer => {
        if (layer.id.includes('road') && layer.type === 'line') {
          map.setPaintProperty(layer.id, 'line-color', '#7f8c8d'); // màu cam đẹp
          map.setPaintProperty(layer.id, 'line-width', 1.5);
        }
      });
    // Loại bỏ building 3D
    layers.forEach(layer => {
      if (layer.type === 'fill-extrusion' && layer.id.includes('building')) {
        map.setPaintProperty(layer.id, 'fill-extrusion-height', 0);
        map.setPaintProperty(layer.id, 'fill-extrusion-base', 0);
        map.setPaintProperty(layer.id, 'fill-extrusion-opacity', 0);
      }
    });
  
    // Tô màu lớp thực vật
    layers.forEach(layer => {
      if (layer.type === 'fill' &&
          (layer.id.includes('landcover') || layer.id.includes('landuse') || layer.id.includes('park'))) {
        map.setPaintProperty(layer.id, 'fill-color', '#2ecc71');
        map.setPaintProperty(layer.id, 'fill-opacity', 0.3);
      }
    });
    const landcoverLayer = layers.find(l => l.id.includes('landcover'));
    // Lớp magma
    const waterLayer = layers.find(l => l.id.includes('water'));
    map.addLayer({
      id: 'magma-layer',
      type: 'fill',
      source: {
        type: 'geojson',
        data: 'data/magma.json'
      },
      paint: {
        'fill-color': '#ff3300',
        'fill-opacity': 0.6,
        'fill-outline-color': '#000000'
      }
    }, waterLayer?.id);
  
    // Lớp infrastructure
    const buildingLayer = layers.find(l => l.id.includes('building'));
    map.addLayer({
      id: 'infrastructure-layer',
      type: 'fill',
      source: {
        type: 'geojson',
        data: 'data/infrastructure.json'
      },
      paint: {
        'fill-color': '#ff6600',
        'fill-opacity': 0.6
      }
    }, buildingLayer?.id);
    
      // Lớp đường demo
      map.addLayer({
        id: 'line-demo-layer',
        type: 'line',
        source: {
          type: 'geojson',
          data: 'data/line-demo.json'
        },
        paint: {
          'line-color': '#ff0000',
          'line-width': 0.5
        }
      }, 'magma-layer');

    // Lớp nền địa chất
 
    map.addLayer({
      id: 'nendc-layer',
      type: 'fill',
      source: {
          type: 'geojson',
          data: 'data/nendc.json'
      },
      paint: {
          'fill-color': [
              'get', 'colorcode'  // 'color_code' là tên thuộc tính chứa mã màu hex trong GeoJSON
          ],
          'fill-opacity': 0.5      // Độ trong suốt của màu fill
      }
  }, landcoverLayer?.id);

  

    // Lớp đường biên giới
    map.addLayer({
      id: 'biengioi-layer',
      type: 'line',
      source: {
        type: 'geojson',
        data: 'data/biengioi.json'
      },
      paint: {
        'line-color': '#000000',
        'line-width': 1,
        'line-dasharray': [4, 2]
      }
    });

    // Ranh giới địa chất
    map.addLayer({
      id: 'ranhgioidc-layer',
      type: 'line',
      source: {
        type: 'geojson',
        data: 'data/ranhgioidc.json'
      },
      paint: {
        'line-color': '#000000',
        'line-width': 0.5
                }
    });
  
    // Lớp điểm NKN
    map.loadImage('assets/marker-icon.png', (err, image) => {
      if (err) throw err;
      if (!map.hasImage('marker-icon')) {
        map.addImage('marker-icon', image);
      }
  
      map.addLayer({
        id: 'diemnn-layer',
        type: 'symbol',
        source: {
          type: 'geojson',
          data: 'data/diemnn.json'
        },
        layout: {
          'icon-image': 'marker-icon',
          'icon-size': 0.05,
          'icon-allow-overlap': true,
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Bold'],
          'text-size': 12,
          'text-offset': [0, 1.2],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#111'
        }
      });
    });
  
    // Popup điểm NKN
    map.on('click', 'diemnn-layer', (e) => {
      const props = e.features[0].properties;
      const fieldsToShow = {
        Sè_hiÖu_nguån_NKN: 'Số hiệu nguồn:',
        Tªn_nguån: 'Tên nguồn:',
        TØnh: 'Tỉnh:',
        NhiÖt__é_n_íc_trªn_bÒ_mÆt__oC_: 'Nhiệt độ (°C):'
      };
  
      const rows = Object.entries(fieldsToShow)
        .filter(([field]) => field in props)
        .map(([field, label]) => `
          <tr>
            <td>${label}</td>
            <td>${props[field]}</td>
          </tr>
        `).join('');
  
      const content = `
        <div class="popup-wrapper">
          <h4 class="popup-title">Thông tin nguồn NKN</h4>
          <table class="popup-table">${rows}</table>
        </div>
      `;
  
      new maplibregl.Popup({ closeButton: false })
        .setLngLat(e.lngLat)
        .setHTML(content)
        .addTo(map);
    });

    map.on('click', 'biengioi-layer', (e) => {
      // Lấy thuộc tính của đối tượng được click
      const properties = e.features[0].properties;
      
      // Xây dựng nội dung cho popup
      const content = `
        <strong>Đường biên giới</strong><br>
        Tên: ${properties.Loai_RG}<br>
        <strong>Thông tin khác:</strong><br>
        <!-- Thêm các trường thông tin khác nếu có -->
      `;
    
      // Tạo một popup và hiển thị tại vị trí click
      new maplibregl.Popup()
        .setLngLat(e.lngLat)  // Vị trí click
        .setHTML(content)     // Nội dung popup
        .addTo(map);          // Thêm popup vào bản đồ
    });
    

    // Popup nền Địa chất
    map.on('click', 'nedc-layer', (e) => {
      const props = e.features[0].properties;
      const fieldsToShow = {
          Diatang: 'Địa tầng:'
      };
  
      const rows = Object.entries(fieldsToShow)
        .filter(([field]) => field in props)
        .map(([field, label]) => `
          <tr>
            <td>${label}</td>
            <td>${props[field]}</td>
          </tr>
        `).join('');
  
      const content = `
        <div class="popup-wrapper">
          <h4 class="popup-title">Thông tin địa tầng</h4>
          <table class="popup-table">${rows}</table>
        </div>
      `;
  
      new maplibregl.Popup({ closeButton: false })
        .setLngLat(e.lngLat)
        .setHTML(content)
        .addTo(map);
    });
  
    // Hover cursor
    ['infrastructure-layer', 'magma-layer', 'diemnn-layer', 'biengioi-layer', 'ranhgioidc-layer', 'nendc-layer'].forEach(layerId => {
      map.on('mouseenter', layerId, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
      });
    });
  
    // Toggle lớp
    document.querySelectorAll('.layer-toggle').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const layerKey = e.target.getAttribute('data-layer');
        const visibility = e.target.checked ? 'visible' : 'none';
        const targetLayers = map.getStyle().layers.filter(layer =>
          layer.id === layerKey || layer.id.includes(layerKey)
        );
        targetLayers.forEach(layer => {
          map.setLayoutProperty(layer.id, 'visibility', visibility);
        });
      });
    });
  });
  let diemnnFeatures = []; // để lưu toàn bộ điểm khi load

map.on('load', () => {
  // ... (code thêm lớp điểm đã có)

  // sau khi load diemnn-layer:
  fetch('data/diemnn.json')
    .then(res => res.json())
    .then(data => {
      diemnnFeatures = data.features;
    });

  // ... (code khác)
});

// 🔍 Hàm tìm kiếm theo Sè_hiÖu_nguån_NKN
function searchNguon() {
    const keyword = document.getElementById('searchInput').value.trim();
    if (!keyword || !diemnnFeatures.length) return;
  
    const found = diemnnFeatures.find(f => f.properties.Sè_hiÖu_nguån_NKN === keyword);
    if (found) {
      const [lng, lat] = found.geometry.coordinates;
      map.flyTo({ center: [lng, lat], zoom: 14 });
  
      const props = found.properties;
  
      // ➕ Hiển thị popup
      const popupContent = `
        <div class="popup-wrapper">
          <h4 class="popup-title">Thông tin nguồn NKN</h4>
          <table class="popup-table">
            <tr><td>Số hiệu nguồn:</td><td>${props.Sè_hiÖu_nguån_NKN}</td></tr>
            <tr><td>Tên nguồn:</td><td>${props.Tªn_nguån}</td></tr>
            <tr><td>Tỉnh:</td><td>${props.TØnh}</td></tr>
            <tr><td>Nhiệt độ (°C):</td><td>${props.NhiÖt__é_n_íc_trªn_bÒ_mÆt__oC_}</td></tr>
          </table>
        </div>
      `;
      new maplibregl.Popup({ closeButton: false })
        .setLngLat([lng, lat])
        .setHTML(popupContent)
        .addTo(map);
  
      // ➕ Hiển thị thông báo và bảng bên trái
      document.getElementById("search-result").style.display = "block";
      document.getElementById("infoBox").style.display = "none";
  
      document.getElementById("detailBtn").onclick = () => {
        const infoTable = document.getElementById("infoTable");
        infoTable.innerHTML = "";
  
        const fieldsToShow = {
            Sè_hiÖu_nguån_NKN: 'Số hiệu nguồn:',
            Tªn_nguån: 'Tên nguồn:',
            Th_n__b_n: 'Thôn:',
            X_: 'Xã:',
            HuyÖn: 'Huyện',
            TØnh: 'Tỉnh:',
            _Æc__iÓm_xuÊt_lé: 'Đặc điểm xuất lộ',
            NhiÖt__é_n_íc_trªn_bÒ_mÆt__oC_: 'Nhiệt độ (°C):',
            TDS___mg_l_: 'Độ tổng khoáng hóa, mg/l'
        };
  
        Object.entries(fieldsToShow).forEach(([key, label]) => {
          if (props[key]) {
            infoTable.innerHTML += `
              <tr>
                <td style="padding: 4px 6px; font-weight: bold; color: #2c3e50;">${label}</td>
                <td style="padding: 4px 6px; text-align: right; color: #34495e;">${props[key]}</td>
              </tr>
            `;
          }
        });
  
        document.getElementById("infoBox").style.display = "block";
      };
  
    } else {
      alert("Không tìm thấy nguồn phù hợp!");
    }
  }
  

  