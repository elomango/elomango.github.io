export class AdSpace {
    constructor() {
        this.adContainers = new Map();
    }

    createAdContainer(id, position) {
        const container = document.createElement('div');
        container.id = `ad-${id}`;
        container.className = 'ad-container';
        container.setAttribute('data-ad-position', position);
        container.style.cssText = this.getAdStyles(position);
        
        this.adContainers.set(id, container);
        return container;
    }

    getAdStyles(position) {
        const baseStyles = `
            background: #f9f9f9;
            border: 1px dashed #ccc;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            color: #999;
            font-size: 14px;
            margin: 20px 0;
        `;

        const positionStyles = {
            'header': 'min-height: 90px; margin-bottom: 30px;',
            'sidebar': 'min-height: 250px; width: 300px;',
            'content': 'min-height: 100px; margin: 30px 0;',
            'footer': 'min-height: 90px; margin-top: 30px;'
        };

        return baseStyles + (positionStyles[position] || '');
    }

    insertAd(containerId, adContent) {
        const container = this.adContainers.get(containerId);
        if (container) {
            container.innerHTML = adContent;
        }
    }

    setupAdPlaceholders() {
        const headerAd = this.createAdContainer('header-ad', 'header');
        headerAd.innerHTML = '[Ad Space - Header Banner]';
        
        const sidebarAd = this.createAdContainer('sidebar-ad', 'sidebar');
        sidebarAd.innerHTML = '[Ad Space - Sidebar]';
        
        const contentAd = this.createAdContainer('content-ad', 'content');
        contentAd.innerHTML = '[Ad Space - Content]';
        
        const footerAd = this.createAdContainer('footer-ad', 'footer');
        footerAd.innerHTML = '[Ad Space - Footer Banner]';
        
        return {
            header: headerAd,
            sidebar: sidebarAd,
            content: contentAd,
            footer: footerAd
        };
    }

    loadAd(position, adConfig) {
        console.log(`Loading ad for position: ${position}`, adConfig);
    }
}