/**
 * 图片压缩工具
 * 支持将大于3MB的图片压缩到3MB以下
 * 最大支持50MB的图片压缩
 */

// 压缩图片的主要函数
export const compressImage = (file, maxSizeMB = 3, maxOriginalSizeMB = 50) => {
  return new Promise((resolve, reject) => {
    // 检查文件大小是否超过最大支持大小
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > maxOriginalSizeMB) {
      reject(new Error(`图片大小不能超过 ${maxOriginalSizeMB}MB`));
      return;
    }

    // 如果文件已经小于等于目标大小，直接返回原文件
    if (fileSizeMB <= maxSizeMB) {
      resolve(file);
      return;
    }

    // 创建Canvas进行压缩
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // 计算压缩比例
      let quality = 0.9;
      let width = img.width;
      let height = img.height;

      // 如果图片尺寸过大，先按比例缩小
      const maxDimension = 2048;
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      // 绘制图片到Canvas
      ctx.drawImage(img, 0, 0, width, height);

      // 尝试不同的质量值来达到目标大小
      const tryCompress = (currentQuality) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('图片压缩失败'));
              return;
            }

            const compressedSizeMB = blob.size / 1024 / 1024;
            
            // 如果压缩后的大小仍然超过目标大小，继续降低质量
            if (compressedSizeMB > maxSizeMB && currentQuality > 0.1) {
              // 根据当前大小和目标大小的比例调整质量
              const ratio = maxSizeMB / compressedSizeMB;
              const newQuality = Math.max(0.1, currentQuality * ratio * 0.8);
              tryCompress(newQuality);
            } else {
              // 创建新的File对象
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: file.lastModified
              });
              
              console.log(`图片压缩完成: ${fileSizeMB.toFixed(2)}MB -> ${compressedSizeMB.toFixed(2)}MB`);
              resolve(compressedFile);
            }
          },
          file.type,
          currentQuality
        );
      };

      // 开始压缩
      tryCompress(quality);
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    // 读取文件
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    reader.readAsDataURL(file);
  });
};

// 批量压缩图片
export const compressImages = async (files, maxSizeMB = 3, maxOriginalSizeMB = 50) => {
  const compressedFiles = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      const compressedFile = await compressImage(files[i], maxSizeMB, maxOriginalSizeMB);
      compressedFiles.push(compressedFile);
    } catch (error) {
      console.error(`压缩第 ${i + 1} 张图片失败:`, error);
      // 如果压缩失败，使用原文件
      compressedFiles.push(files[i]);
    }
  }
  
  return compressedFiles;
};

// 格式化文件大小
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}; 