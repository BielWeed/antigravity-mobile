const fs = require('fs');
const path = require('path');

// V45.0-Omni-Genesis: The Omni-Refractor Context Shield
// Aumenta a inteligência do Agente ao compactar massivamente a leitura de arquivos
// Elimina comentários irrelevantes, normaliza espaços, mapeia apenas as AST Boundaries (Classes/Funções)

function refract(filePath) {
    if (!fs.existsSync(filePath)) return null;
    let code = fs.readFileSync(filePath, 'utf8');
    
    // Nível 1: Remoção de Ruído Branco e Comentários (Exceto // TODO e JSDoc)
    code = code.replace(/\/\*(?![\s\S]*@).*?\*\//g, '');
    code = code.replace(/\/\/ (?!TODO|FIXME).*$/gm, '');
    
    // Nível 2: Condensação de Espaços (OOM Shield)
    code = code.replace(/\n\s*\n/g, '\n');
    
    // Nível 3: Extração de Esqueleto (AST Pseudo-Parser)
    // Retorna um mapa super denso onde a IA consegue entender a estrutura
    // de módulos com 5000 linhas usando apenas 200 tokens.
    
    const skeleton = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
        if (
            line.includes('class ') || 
            line.includes('function ') || 
            line.includes('const ') && line.includes('=>') ||
            line.includes('module.exports') ||
            line.includes('export ')
        ) {
            skeleton.push(`[Line ${index + 1}] ${line.trim()}`);
        }
    });

    return {
        originalSize: code.length,
        skeletonTokens: skeleton.length,
        skeleton: skeleton.join('\n')
    };
}

module.exports = { refract };
