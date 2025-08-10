const fs = require('fs');
const path = require('path');

// Helper function to replace template variables
function processTemplate(template, data) {
    // Replace simple variables {{variable}}
    let processed = template.replace(/\{\{([^#\/].*?)\}\}/g, (match, key) => {
        const keys = key.trim().split('.');
        let value = data;
        for (const k of keys) {
            value = value?.[k];
        }
        return value !== undefined ? value : match;
    });
    
    // Handle conditional blocks {{#if_eq var 'value'}}...{{/if_eq}}
    processed = processed.replace(/\{\{#if_eq\s+(\w+)\s+'([^']+)'\}\}(.*?)\{\{\/if_eq\}\}/g, 
        (match, variable, value, content) => {
            return data[variable] === value ? content : '';
        });
    
    return processed;
}

// Build function for main index pages
function buildIndexPages() {
    const languages = ['ko', 'en'];
    const templatePath = path.join(__dirname, 'templates', 'index.template.html');
    const template = fs.readFileSync(templatePath, 'utf8');
    
    languages.forEach(lang => {
        const translationPath = path.join(__dirname, 'assets', 'i18n', `${lang}.json`);
        const translations = JSON.parse(fs.readFileSync(translationPath, 'utf8'));
        
        const html = processTemplate(template, translations);
        const outputPath = path.join(__dirname, lang, 'index.html');
        
        // Ensure directory exists
        if (!fs.existsSync(path.join(__dirname, lang))) {
            fs.mkdirSync(path.join(__dirname, lang), { recursive: true });
        }
        
        fs.writeFileSync(outputPath, html);
        console.log(`✅ Built ${lang}/index.html`);
    });
}

// Build privacy and terms pages
function buildStaticPages() {
    const pages = ['privacy', 'terms'];
    const languages = ['ko', 'en'];
    
    pages.forEach(page => {
        const templatePath = path.join(__dirname, 'templates', `${page}.template.html`);
        
        // Check if template exists, if not, we'll create it later
        if (!fs.existsSync(templatePath)) {
            console.log(`⚠️  Template for ${page} not found, skipping...`);
            return;
        }
        
        const template = fs.readFileSync(templatePath, 'utf8');
        
        languages.forEach(lang => {
            const translationPath = path.join(__dirname, 'assets', 'i18n', `${lang}.json`);
            const translations = JSON.parse(fs.readFileSync(translationPath, 'utf8'));
            
            const html = processTemplate(template, translations);
            const outputPath = path.join(__dirname, lang, `${page}.html`);
            
            fs.writeFileSync(outputPath, html);
            console.log(`✅ Built ${lang}/${page}.html`);
        });
    });
}

// Update CSS paths in the styles file
function updateStylesPaths() {
    const stylesPath = path.join(__dirname, 'assets', 'css', 'styles.css');
    if (fs.existsSync(stylesPath)) {
        let css = fs.readFileSync(stylesPath, 'utf8');
        // Update any relative paths if needed
        fs.writeFileSync(stylesPath, css);
        console.log('✅ Styles updated');
    }
}

// Create language selector component
function createLanguageSelector() {
    const selectorCSS = `
/* Language Selector Styles */
.language-selector {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 1000;
}

.language-selector select {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid #e5e5e7;
    background: white;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.language-selector select:hover {
    border-color: #007aff;
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.1);
}

.language-selector select:focus {
    outline: none;
    border-color: #007aff;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}
`;

    const stylesPath = path.join(__dirname, 'assets', 'css', 'styles.css');
    const existingStyles = fs.readFileSync(stylesPath, 'utf8');
    
    if (!existingStyles.includes('Language Selector Styles')) {
        fs.appendFileSync(stylesPath, selectorCSS);
        console.log('✅ Added language selector styles');
    }
}

// Main build function
function build() {
    console.log('🔨 Starting build process...\n');
    
    // Create directories if they don't exist
    const dirs = ['ko', 'en', 'assets/css', 'assets/js', 'assets/i18n', 'templates'];
    dirs.forEach(dir => {
        const dirPath = path.join(__dirname, dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    });
    
    // Build pages
    buildIndexPages();
    buildStaticPages();
    
    // Update styles
    createLanguageSelector();
    updateStylesPaths();
    
    console.log('\n✨ Build completed successfully!');
}

// Run build
build();