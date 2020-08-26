class Legendary {
  static init() {
    // Needed to check against Q param.
    this.legendaries = [
      'mp_animal_alligator_legendary_01', 'mp_animal_alligator_legendary_02', 'mp_animal_bear_legendary_01',
      'mp_animal_bear_legendary_02', 'mp_animal_beaver_legendary_01', 'mp_animal_beaver_legendary_02',
      'mp_animal_bison_legendary_01', 'mp_animal_bison_legendary_02', 'mp_animal_boar_legendary_01',
      'mp_animal_boar_legendary_02', 'mp_animal_buck_legendary_01', 'mp_animal_buck_legendary_02',
      'mp_animal_cougar_legendary_01', 'mp_animal_cougar_legendary_02', 'mp_animal_coyote_legendary_01',
      'mp_animal_coyote_legendary_02', 'mp_animal_elk_legendary_01', 'mp_animal_elk_legendary_02',
      'mp_animal_fox_legendary_01', 'mp_animal_fox_legendary_02', 'mp_animal_moose_legendary_01',
      'mp_animal_moose_legendary_02', 'mp_animal_panther_legendary_01', 'mp_animal_panther_legendary_02',
      'mp_animal_ram_legendary_01', 'mp_animal_ram_legendary_02', 'mp_animal_wolf_legendary_01',
      'mp_animal_wolf_legendary_02'
    ];

    // Legendary animals not yet released.
    this.notReleased = [
      'mp_animal_bear_legendary_01', 'mp_animal_bear_legendary_02', 'mp_animal_moose_legendary_01',
      'mp_animal_moose_legendary_02', 'mp_animal_panther_legendary_01', 'mp_animal_panther_legendary_02'
    ];

    // PlayStation 4 exclusives
    this.psExclusive = ['mp_animal_ram_legendary_01', 'mp_animal_ram_legendary_02'];

    this.animals = [];
    this.layer = L.layerGroup();
    this.layer.addTo(MapBase.map);

    const pane = MapBase.map.createPane('animalX');
    pane.style.zIndex = 450; // X-markers on top of circle, but behind “normal” markers/shadows
    pane.style.pointerEvents = 'none';
    this.context = $('.menu-hidden[data-type=legendary_animals]');
    this.crossIcon = L.icon({
      iconUrl: './assets/images/icons/cross.png',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    this.onSettingsChanged();
    $('.menu-hidden[data-type="legendary_animals"] > *:first-child a').click(e => {
      e.preventDefault();
      const showAll = $(e.target).attr('data-text') === 'menu.show_all';
      Legendary.animals.forEach(animal => animal.onMap = showAll);
    });
    return Loader.promises['animal_legendary'].consumeJson(data => {
      data.forEach(item => this.animals.push(new Legendary(item)));
      this.onLanguageChanged();
      console.info('%c[Legendary animals] Loaded!', 'color: #bada55; background: #242424');
    });
  }
  static onLanguageChanged() {
    Menu.reorderMenu(this.context);
  }
  static onSettingsChanged(markerSize = Settings.markerSize, shadow = Settings.isShadowsEnabled) {
    this.mainIcon = L.divIcon({
      iconSize: [35 * markerSize, 45 * markerSize],
      iconAnchor: [17 * markerSize, 42 * markerSize],
      popupAnchor: [1 * markerSize, -29 * markerSize],
      html: `
        <img class="icon" src="./assets/images/icons/legendary_animals.png" alt="Icon">
        <img class="background" src="./assets/images/icons/marker_black.png" alt="Background">
        ${shadow ? `<img class="shadow" width="${35 * markerSize}" height="${16 * markerSize}"
            src="./assets/images/markers-shadow.png" alt="Shadow">` : ''}
      `
    });
    this.animals.forEach(animal => animal.reinitMarker());
  }
  // not idempotent (on the environment)
  constructor(preliminary) {
    Object.assign(this, preliminary);
    this._shownKey = `shown.${this.text}`;
    this.element = $('<div class="collectible-wrapper" data-help="item">')
      .on('click', () => this.onMap = !this.onMap)
      .append($('<p class="collectible">').attr('data-text', this.text))
      .translate();
    this.reinitMarker();
    this.element.appendTo(Legendary.context);
  }
  // auto remove marker? from map, recreate marker, auto add? marker
  // idempotent
  reinitMarker() {
    if (this.marker) Legendary.layer.removeLayer(this.marker);
    this.marker = L.layerGroup();
    this.marker.addLayer(L.circle([this.x, this.y], {
      color: "#fdc607",
      fillColor: "#fdc607",
      fillOpacity: 0.5,
      radius: this.radius,
    }));
    this.marker.addLayer(L.marker([this.x, this.y], { icon: Legendary.mainIcon })
      .bindPopup(this.popupContent.bind(this), { minWidth: 400 })
    );
    this.locations.forEach(cross =>
      this.marker.addLayer(L.marker([cross.x, cross.y], {
        icon: Legendary.crossIcon,
        pane: 'animalX',
      }))
    );
    this.onMap = this.onMap;
  }
  popupContent() {
    const snippet = $(`<div class="handover-wrapper-with-no-influence">
        <h1 data-text="${this.text}"></h1>
        <p style='font-size: 16px; text-align: center; padding-bottom: 8px;'>${Legendary.notReleased.includes(this.text) ? Language.get('map.generic_not_released') : Legendary.psExclusive.includes(this.text) ? Language.get('map.generic_ps_exlusive') : ''}</p>
        <p>${Language.get(this.text + '.desc')}</p>
        <br><p>${Language.get('map.legendary_animal.desc')}</p>
        <button type="button" class="btn btn-info remove-button" data-text="map.remove">
          </button>
      </div>`).translate();
    snippet.find('button').on('click', () => this.onMap = false);
    return snippet[0];
  }
  set onMap(state) {
    if (state) {
      const method = enabledCategories.includes('legendary_animals') ? 'addLayer' : 'removeLayer';
      Legendary.layer[method](this.marker);
      this.element.removeClass('disabled');
      localStorage.setItem(`rdo:${this._shownKey}`, 'true');
    } else {
      Legendary.layer.removeLayer(this.marker);
      this.element.addClass('disabled');
      localStorage.removeItem(`rdo:${this._shownKey}`);
    }
  }
  get onMap() {
    return !!localStorage.getItem(`rdo:${this._shownKey}`);
  }
  static onCategoryToggle() {
    Legendary.animals.forEach(animal => animal.onMap = animal.onMap);
  }
}