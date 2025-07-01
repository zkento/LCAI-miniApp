const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

// 手动实现字符串转换函数，移除 change-case 依赖
function toCamelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function toKebabCase(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

const svgDir = path.resolve(__dirname, '../node_modules/@element-plus/icons-svg');
const outputDir = path.resolve(__dirname, '../assets/images');

function getOutputFilename(iconName, color, format) {
  const baseName = toKebabCase(iconName);
  const colorSuffix = color === 'white' ? '-white' : (color === '#1b68de' ? '' : `-${color.replace('#', '')}`);
  return `${baseName}${colorSuffix}.${format}`;
}

async function convertIcon(iconName, outputFilename, color = '#1b68de', size = 64) {
  // Directly use kebab-case name for source SVG
  const svgFilename = `${iconName}.svg`;
  const svgPath = path.join(svgDir, svgFilename);

  try {
    const svgContent = await fs.readFile(svgPath, 'utf8');
    const modifiedSvg = svgContent.replace(/currentColor/g, color);
    
    const outputPathPng = path.join(outputDir, outputFilename);

    await sharp(Buffer.from(modifiedSvg))
      .resize(size, size)
      .toFile(outputPathPng);

    console.log(`成功将 ${iconName}.svg 转换为 ${outputFilename}`);
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`错误: 找不到SVG源文件: ${svgPath}`);
    } else {
      console.error(`错误: 读取或转换SVG文件失败: ${svgPath}`, error);
    }
  }
}

async function main() {
  const iconsToConvert = [
    // --- Tab Bar Icons ---
    // Unselected (Grey, 128px)
    { name: 'house', outputName: 'home.png', color: '#909399', size: 128 },
    { name: 'data-line', outputName: 'analyse.png', color: '#909399', size: 128 },
    { name: 'clock', outputName: 'history.png', color: '#909399', size: 128 },
    { name: 'user', outputName: 'profile.png', color: '#909399', size: 128 },
    // Selected (Blue, 128px)
    { name: 'house', outputName: 'home_selected.png', color: '#1b68de', size: 128 },
    { name: 'data-line', outputName: 'analyse_selected.png', color: '#1b68de', size: 128 },
    { name: 'clock', outputName: 'history_selected.png', color: '#1b68de', size: 128 },
    { name: 'user', outputName: 'profile_selected.png', color: '#1b68de', size: 128 },
    
    // --- Page Category Icons (Blue, 128px) ---
    { name: 'user', outputName: 'personal_credit.png', color: '#1b68de', size: 128 },
    { name: 'office-building', outputName: 'business_credit.png', color: '#1b68de', size: 128 },
    { name: 'money', outputName: 'finance_advice.png', color: '#1b68de', size: 128 },
    { name: 'house', outputName: 'property_advice.png', color: '#1b68de', size: 128 },

    // --- Common UI Icons (128px) ---
    { name: 'arrow-right', outputName: 'arrow_right.png', color: '#909399', size: 128 },
    { name: 'caret-right', outputName: 'caret-right-white.png', color: 'white', size: 128 },
    { name: 'delete', outputName: 'delete_icon.png', color: '#f56c6c', size: 128 },
    { name: 'delete', outputName: 'delete-white.png', color: 'white', size: 128 },
    { name: 'document', outputName: 'file_icon.png', color: '#1b68de', size: 128 },
    { name: 'document', outputName: 'file_icon_white.png', color: 'white', size: 128 },
    { name: 'picture', outputName: 'image_icon.png', color: '#1b68de', size: 128 },
    { name: 'picture', outputName: 'image_icon_white.png', color: 'white', size: 128 },
    { name: 'upload', outputName: 'upload.png', color: '#1b68de', size: 128 },
  ];

  await fs.mkdir(outputDir, { recursive: true });

  for (const icon of iconsToConvert) {
    try {
      await convertIcon(icon.name, icon.outputName, icon.color, icon.size);
    } catch (error) {
      console.error(`处理图标 ${icon.name} 时发生错误:`, error);
    }
  }
}

main().catch(err => {
  console.error("执行图标转换脚本时发生未捕获的错误:", err);
});