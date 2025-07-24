<template>
  <div class="credit-analyse-form">
    <div class="form-container">
      <!-- 左侧输入区 -->
      <div class="input-panel">
        <div class="panel-header">
          <h2 class="panel-title">上传{{ chatType === 'personal-credit' ? '个人' : '企业' }}征信报告</h2>
        </div>
        <div class="panel-content">
          <p class="description-hint">请选择要上传的文件类型，完整清晰的报告能获得更准确的分析结果。</p>
          
          <!-- 文件类型选择器 -->
          <div class="file-type-selector">
            <div class="file-type-cards">
              <!-- PDF文件类型卡片 -->
              <el-tooltip
                v-if="fileList.length > 0 && fileUploadType !== 'pdf'"
                content="若要上传PDF文件，请先清除已上传的图片"
                placement="top"
                :show-after="100"
                effect="dark"
              >
                <div 
                  class="file-type-card" 
                  :class="{'active': fileUploadType === 'pdf', 'disabled': fileList.length > 0}"
                  @click="fileList.length === 0 && (fileUploadType = 'pdf')"
                >
                  <div class="file-type-icon">
                    <el-icon><Document /></el-icon>
                  </div>
                  <div class="file-type-info">
                    <div class="file-type-name">PDF文件</div>
                    <div class="file-type-desc">上传征信报告原版或扫描版文件<span class="file-type-desc-tip">（建议）</span></div>
                  </div>
                </div>
              </el-tooltip>
              
              <div 
                v-else
                class="file-type-card" 
                :class="{'active': fileUploadType === 'pdf', 'disabled': fileList.length > 0 && fileUploadType !== 'pdf'}"
                @click="fileList.length === 0 && (fileUploadType = 'pdf')"
              >
                <div class="file-type-icon">
                  <el-icon><Document /></el-icon>
                </div>
                <div class="file-type-info">
                  <div class="file-type-name">PDF文件</div>
                  <div class="file-type-desc">上传征信报告原版或扫描版文件<span class="file-type-desc-tip">（建议）</span></div>
                </div>
              </div>
              
              <!-- 图片文件类型卡片 -->
              <el-tooltip
                v-if="fileList.length > 0 && fileUploadType !== 'images'"
                content="若要上传图片文件，请先清除已上传的PDF"
                placement="top"
                :show-after="100"
                effect="dark"
              >
                <div 
                  class="file-type-card" 
                  :class="{'active': fileUploadType === 'images', 'disabled': fileList.length > 0}"
                  @click="fileList.length === 0 && (fileUploadType = 'images')"
                >
                  <div class="file-type-icon">
                    <el-icon><Picture /></el-icon>
                  </div>
                  <div class="file-type-info">
                    <div class="file-type-name">图片文件</div>
                    <div class="file-type-desc">上传征信报告的拍照图片文件</div>
                  </div>
                </div>
              </el-tooltip>
              
              <div 
                v-else
                class="file-type-card" 
                :class="{'active': fileUploadType === 'images', 'disabled': fileList.length > 0 && fileUploadType !== 'images'}"
                @click="fileList.length === 0 && (fileUploadType = 'images')"
              >
                <div class="file-type-icon">
                  <el-icon><Picture /></el-icon>
                </div>
                <div class="file-type-info">
                  <div class="file-type-name">图片文件</div>
                  <div class="file-type-desc">上传征信报告的拍照图片文件</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="upload-dropzone" 
               :class="{'is-dragover': isDragover, 'has-file': fileList.length > 0}"
               @dragover.prevent="isDragover = true"
               @dragleave.prevent="isDragover = false"
               @drop.prevent="handleFileDrop">
            <!-- 右上角清除按钮 -->
            <div v-if="fileList.length > 0" class="clear-files-button" @click.stop="resetFileList">
              <el-icon><Delete /></el-icon>
              <span class="clear-text">清除文件</span>
            </div>
            
            <el-upload
              class="upload-area"
              drag
              action="#"
              :auto-upload="false"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              :limit="fileUploadType === 'pdf' ? 1 : 100"
              :file-list="fileList"
              :accept="fileAcceptType"
              :multiple="fileUploadType === 'images'"
              list-type="picture"
              ref="uploadRef"
              :show-file-list="false"
            >
              <div class="upload-content">
                <el-icon class="upload-icon"><UploadFilled /></el-icon>
                <div class="upload-text">
                  <span v-if="fileList.length === 0">拖拽文件到此处或 <em>点击上传</em></span>
                  <span v-else>已上传: <strong>{{ fileUploadCountText }}</strong>
                    <em v-if="fileUploadType === 'images' && fileList.length < 100" class="continue-upload-hit">继续上传</em>
                  </span>
                </div>
                <div class="upload-hint">
                  <template v-if="fileUploadType === 'pdf'">
                    限PDF单文件，大小不要超过100MB
                  </template>
                  <template v-else>
                    单张图片不要超过10MB，上限100张
                  </template>
                </div>
              </div>
            </el-upload>
          </div>
          
          <!-- 图片预览区 -->
          <div v-if="fileUploadType === 'images' && fileList.length > 0" class="image-preview-container">
            <h3 class="preview-title">已上传的图片 
              <span class="sort-hint" 
                v-if="fileUploadType === 'images' && fileList.length > 1">
                可拖拽图片调整排序
              </span>
              <div class="preview-switch">
                <span class="switch-label">大图预览</span>
                <el-switch
                  v-model="previewEnabled"
                  active-text="开"
                  inactive-text="关"
                  inline-prompt
                />
              </div>
            </h3>
            <div class="image-preview-list">
              <div v-for="(file, index) in fileList" 
                   :key="index" 
                   class="image-preview-item"
                   draggable="true"
                   @dragstart="handleDragStart($event, index)"
                   @dragover.prevent="handleDragOver($event, index)"
                   @drop="handleDrop($event, index)"
                   @dragenter.prevent
                   @dragleave.prevent
                   @mousedown="handleImageMouseDown"
                   @mouseup="handleImageMouseUp">
                <div class="image-preview-wrapper">
                  <img :src="file.url" 
                       :alt="file.name" 
                       class="preview-image" 
                       @mouseover="showImagePreview(file)" 
                       @mouseleave="hideImagePreview()"/>
                  <div class="image-preview-actions">
                    <el-button type="danger" circle size="small" @click="removeImageAt(index)" 
                      :disabled="uploading" class="remove-image-btn">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                  <div class="image-preview-index">{{ index + 1 }}</div>
                </div>
                <div class="image-preview-name">{{ file.name }}</div>
              </div>
            </div>
          </div>
          
          <!-- 图片悬浮预览 -->
          <div v-if="hoverPreview.show" class="image-hover-preview" :style="hoverPreview.style">
            <img :src="hoverPreview.url" alt="预览" />
            <div class="hover-preview-info">
              <span>{{ hoverPreview.name }}</span>
              <span>{{ hoverPreview.size }}</span>
            </div>
          </div>
          
          <!-- 添加客户姓名输入框 -->
          <div class="customer-name-input">
            <el-form :model="uploadForm" :rules="uploadRules" ref="uploadFormRef" @submit.prevent>
              <el-form-item prop="customerName" :rules="[
                { required: true, message: '请输入客户姓名', trigger: 'blur' },
                { min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
              ]">
                <el-input 
                  v-model="uploadForm.customerName"
                  placeholder="请输入客户姓名（必填，方便你查询结果）"
                  clearable
                  :disabled="uploading"
                  @keydown.enter.prevent="handleNameEnter"
                >
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
            </el-form>
          </div>
          
          <div class="upload-actions">
            <el-button 
              type="primary" 
              class="action-button" 
              @click="submitForm"
              :loading="uploading"
              :disabled="fileList.length === 0"
            >
              <el-icon v-if="!processingImages"><CaretRight /></el-icon>
              <span v-if="!processingImages">让AI生成征信分析报告</span>
              <span v-else>图片处理中...{{ processingProgress }}%</span>
            </el-button>
          </div>
        </div>
      </div>
      
      <!-- 右侧参考/说明区 -->
      <div class="content-panel">
        <div class="reference-content">
          <div class="panel-header">
            <h2 class="panel-title">使用说明</h2>
          </div>
          <div class="panel-content">
            <div class="reference-grid">
              <div class="reference-group">
                <h4>文件要求</h4>
                <div class="reference-items">
                  <span class="reference-item">
                    <span class="item-label">最多1份的PDF报告文件（不超过100MB）</span>
                  </span>
                  <span class="reference-item">
                    <span class="item-label">或最多100张的报告图片（每张不超过10MB）</span>
                  </span>
                </div>
              </div>
              <div class="reference-group">
                <h4>报告要求</h4>
                <div class="reference-items">
                  <span class="reference-item">
                    <span class="item-label">请确保上传完整的征信报告内容</span>
                  </span>
                  <span class="reference-item">
                    <span class="item-label">报告内容需要清晰可辨，避免模糊不清</span>
                  </span>
                  <span class="reference-item">
                    <span class="item-label">所有数据仅用于分析，未经授权不会被他用</span>
                  </span>
                  <span class="reference-item">
                    <span class="item-label">支持简版、详版、公积金中心提供的征信报告</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div class="tips-section">
              <div class="tips-block">
                <h4> ✨ 重要提示</h4>
                <blockquote class="tips-content">
                  扫描版（特别是原版）的PDF征信报告，可以获得非常精准的分析结果；手机拍摄的征信报告照片可能会因为光线、角度、清晰度、平整度等问题，导致分析结果不准确。
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 

<script>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { jsPDF } from 'jspdf'
import { Document, Check, Delete, CaretRight, User, Picture, UploadFilled } from '@element-plus/icons-vue'
import { extractTextFromPDF } from '../api/pdfParseX'

export default {
  name: 'creditAnalyseForm',
  components: {
    Document,
    Check,
    Delete,
    CaretRight,
    User,
    Picture,
    UploadFilled
  },
  props: {
    chatType: {
      type: String,
      default: 'personal-credit'
    }
  },
  emits: ['submit'],
  setup(props, { emit }) {
    // 上传状态
    const fileList = ref([])
    const fileUploadType = ref('pdf')
    const isDragover = ref(false)
    const uploadRef = ref(null)
    const uploadFormRef = ref(null)
    const uploading = ref(false)
    const processingImages = ref(false)
    const processingProgress = ref(0)
    const previewEnabled = ref(true)
    const hoverPreview = reactive({
      show: false,
      url: '',
      name: '',
      size: '',
      style: {
        top: '0px',
        left: '0px'
      }
    })
    const dragIndex = ref(-1)
    const isDragging = ref(false)
    
    // 表单数据
    const uploadForm = reactive({
      customerName: ''
    })
    
    const uploadRules = {
      customerName: [
        { required: true, message: '请输入客户姓名', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
      ]
    }
    
    // 用于防止多条消息同时显示
    let _fileChangeMessageTimer = null
    let _dropMessageTimer = null
    
    // 计算属性
    const fileAcceptType = computed(() => {
      return fileUploadType.value === 'pdf' ? '.pdf' : 'image/*'
    })
    
    const fileUploadCountText = computed(() => {
      if (fileUploadType.value === 'pdf') {
        return fileList.value.length > 0 ? fileList.value[0].name : ''
      } else {
        return `${fileList.value.length}张图片`
      }
    })
    
    // 文件处理方法
    const handleFileChange = (file, fileListArg) => {
      console.log('文件变更:', file, fileListArg)
      
      // 使用一个标志来控制批量上传时只显示一次消息
      clearTimeout(_fileChangeMessageTimer)
      
      // 验证当前文件是否为最后一个变更的文件
      const isLastFile = file.uid === fileListArg[fileListArg.length - 1].uid
      
      // 验证文件类型
      const isPdf = file.raw.type === 'application/pdf'
      const isImage = file.raw.type.startsWith('image/')
      
      // 验证文件与当前选择的上传类型是否匹配
      if (fileUploadType.value === 'pdf' && !isPdf) {
        ElMessage.error('请上传PDF格式的文件!')
        // 直接更新fileList，而不是通过过滤现有fileList
        fileList.value = fileList.value.filter(f => f.uid !== file.uid)
        return false
      }
      
      if (fileUploadType.value === 'images' && !isImage) {
        ElMessage.error('请上传图片格式的文件!')
        // 直接更新fileList，而不是通过过滤现有fileList
        fileList.value = fileList.value.filter(f => f.uid !== file.uid)
        return false
      }
      
      // 验证文件大小
      const maxSize = fileUploadType.value === 'pdf' ? 100 : 10 // PDF 100MB, 图片 10MB
      const isFileSizeValid = file.size / 1024 / 1024 < maxSize
      
      if (!isFileSizeValid) {
        const sizeLimit = fileUploadType.value === 'pdf' ? '100MB' : '10MB'
        ElMessage.error(`文件大小不能超过${sizeLimit}!`)
        fileList.value = fileList.value.filter(f => f.uid !== file.uid)
        return false
      }
      
      // 为上传的文件添加URL（防止URL为空导致预览问题）
      if (!file.url && file.raw) {
        file.url = URL.createObjectURL(file.raw)
      }
      
      // 处理超出数量限制的文件
      if (fileUploadType.value === 'pdf') {
        // 对于PDF，只保留最后一个文件
        fileList.value = [file] // 直接使用当前文件而不是从fileListArg中取
        
        // 如果是PDF文件，并且客户姓名为空，则自动提取文件名作为客户姓名
        if (isPdf && (!uploadForm.customerName || uploadForm.customerName === '')) {
          // 提取文件名（去除.pdf后缀）
          const fileName = file.name.replace(/\.pdf$/i, '');
          uploadForm.customerName = fileName;
          console.log('从PDF文件名自动填入客户姓名:', fileName);
        }
        
        // 提示用户，只在最后一个文件时提示
        if (isLastFile) {
          _fileChangeMessageTimer = setTimeout(() => {
            ElMessage.success('成功添加PDF文件')
          }, 0)
        }
      } else if (fileUploadType.value === 'images') {
        // 对于图片，检查是否超过100张的限制
        if (fileList.value.length >= 100) {
          ElMessage.warning(`已达到100张图片上限，无法继续添加。`)
          return false
        } else {
          // 添加当前图片到文件列表
          fileList.value.push(file)
          
          // 提示用户成功上传
          if (isLastFile) {
            _fileChangeMessageTimer = setTimeout(() => {
              ElMessage.success('成功添加图片')
            }, 0)
          }
        }
      }
      
      return true
    }
    
    const handleFileRemove = (file) => {
      // 从文件列表中移除该文件
      fileList.value = fileList.value.filter(f => f.uid !== file.uid)
      return true
    }
    
    // 该版本的函数有过多的提示，暂注释掉，备用。
    // const resetFileList = () => {
    //   // 如果正在上传，请求确认
    //   if (uploading.value) {
    //     ElMessageBox.confirm('正在处理文件，确认要中止并清空所有文件吗？', '提示', {
    //       confirmButtonText: '确定',
    //       cancelButtonText: '取消',
    //       type: 'warning'
    //     }).then(() => {
    //       // 清理可能创建的内存URL
    //       fileList.value.forEach(file => {
    //         if (file.url && file.url.startsWith('blob:')) {
    //           URL.revokeObjectURL(file.url)
    //         }
    //       })
    //       fileList.value = []
    //       ElMessage.success('已清空所有文件')
    //     }).catch(() => {
    //       // 用户取消操作
    //     })
    //   } else if (fileList.value.length > 0) {
    //     ElMessageBox.confirm('确认要清空所有已上传的文件吗？', '提示', {
    //       confirmButtonText: '确定',
    //       cancelButtonText: '取消',
    //       type: 'warning'
    //     }).then(() => {
    //       // 清理可能创建的内存URL
    //       fileList.value.forEach(file => {
    //         if (file.url && file.url.startsWith('blob:')) {
    //           URL.revokeObjectURL(file.url)
    //         }
    //       })
    //       fileList.value = []
    //       ElMessage.success('已清空所有文件')
    //     }).catch(() => {
    //       // 用户取消操作
    //     })
    //   } else {
    //     ElMessage.info('没有需要清空的文件')
    //   }
    // }

    const resetFileList = () => {
      // 清理所有图片URL
      fileList.value.forEach(file => {
        if (file.url) {
          URL.revokeObjectURL(file.url)
        }
      })
      fileList.value = []
      
      // 清除悬浮预览
      hideImagePreview();
    }    
    
    const handleFileDrop = (e) => {
      isDragover.value = false
      
      // 获取拖拽的文件
      const files = Array.from(e.dataTransfer.files)
      
      // 检查文件类型和数量
      const validFiles = []
      const invalidTypeFiles = []
      const oversizedFiles = []
      
      const maxSizeMB = fileUploadType.value === 'pdf' ? 100 : 10
      
      files.forEach(file => {
        const isPdf = file.type === 'application/pdf'
        const isImage = file.type.startsWith('image/')
        const isTypeValid = (fileUploadType.value === 'pdf' && isPdf) || 
                          (fileUploadType.value === 'images' && isImage)
        
        const isSizeValid = file.size / 1024 / 1024 < maxSizeMB
        
        if (!isTypeValid) {
          invalidTypeFiles.push(file)
        } else if (!isSizeValid) {
          oversizedFiles.push(file)
        } else {
          validFiles.push(file)
        }
      })
      
      clearTimeout(_dropMessageTimer)
      
      // 处理无效类型文件
      if (invalidTypeFiles.length > 0) {
        const fileType = fileUploadType.value === 'pdf' ? 'PDF' : '图片'
        const message = `有${invalidTypeFiles.length}个文件不是${fileType}格式，已自动过滤。`
        _dropMessageTimer = setTimeout(() => {
          ElMessage.warning(message)
        }, 0)
      }
      
      // 处理过大的文件
      if (oversizedFiles.length > 0) {
        const sizeLimit = fileUploadType.value === 'pdf' ? '100MB' : '10MB'
        const message = `有${oversizedFiles.length}个文件大小超过${sizeLimit}，已自动过滤。`
        
        _dropMessageTimer = setTimeout(() => {
          ElMessage.warning(message)
        }, 100)
      }
      
      if (fileUploadType.value === 'pdf') {
        // PDF模式只保留最后一个有效的PDF文件
        if (validFiles.length > 0) {
          const lastFile = validFiles[validFiles.length - 1]
          
          // 创建文件元数据
          const fileData = {
            name: lastFile.name,
            size: lastFile.size,
            raw: lastFile,
            uid: Date.now() + Math.random(),
            url: URL.createObjectURL(lastFile)
          }
          
          // 替换现有文件或添加新文件
          fileList.value = [fileData]
          
          // 如果客户姓名为空，则从PDF文件名提取
          if (!uploadForm.customerName || uploadForm.customerName === '') {
            // 提取文件名（去除.pdf后缀）
            const fileName = lastFile.name.replace(/\.pdf$/i, '');
            uploadForm.customerName = fileName;
            console.log('拖放PDF：从文件名自动填入客户姓名:', fileName);
          }
          
          _dropMessageTimer = setTimeout(() => {
            ElMessage.success('成功添加PDF文件')
          }, 200)
        }
      } else if (fileUploadType.value === 'images') {
        // 图片模式，最多允许100张
        const remainingSlots = 100 - fileList.value.length
        let filesToAdd = validFiles
        let droppedCount = 0
        
        if (validFiles.length > remainingSlots) {
          filesToAdd = validFiles.slice(0, remainingSlots)
          droppedCount = validFiles.length - remainingSlots
        }
        
        // 添加所有有效图片文件
        const newFiles = filesToAdd.map(file => ({
          name: file.name,
          size: file.size,
          raw: file,
          uid: Date.now() + Math.random(),
          url: URL.createObjectURL(file)
        }))
        
        fileList.value = [...fileList.value, ...newFiles]
        
        // 提示用户
        let messages = []
        
        // 提示成功添加
        messages.push(`成功添加图片`)
        
        // 如果有文件被丢弃，添加警告信息
        if (droppedCount > 0) {
          messages.push(`${droppedCount}张图片因超出限制不再上传`)
        }
        
        // 显示一条综合提示
        if (messages.length > 0) {
          _dropMessageTimer = setTimeout(() => {
            if (droppedCount > 0) {
              ElMessage.warning(messages.join('，'))
            } else {
              ElMessage.success(messages[0])
            }
          }, 200)
        }
      }
    }
    
    // 图片预览和排序
    const showImagePreview = (file) => {
      // 如果预览功能关闭或者正在拖拽，则不显示预览
      if (!previewEnabled.value || isDragging.value) return;
      
      // 检查文件是否还在fileList中
      const fileExists = fileList.value.some(f => f.url === file.url);
      if (!fileExists) {
        return; // 如果文件已被删除，不显示预览
      }
      
      // 转换文件大小为易读格式
      const fileSize = formatFileSize(file.size);
      
      // 预先设置悬浮预览数据
      hoverPreview.show = true;
      hoverPreview.url = file.url;
      hoverPreview.name = file.name;
      hoverPreview.size = fileSize;
      hoverPreview.style = {
        top: '0px',
        left: '0px'
      };
      
      // 延迟计算位置，确保DOM已更新
      nextTick(() => {
        // 获取预览元素
        const previewEl = document.querySelector('.image-hover-preview');
        if (!previewEl) return;
        
        // 获取触发预览的原始图片元素位置
        const imgElement = document.querySelector(`.preview-image[src="${file.url}"]`);
        if (!imgElement) return;
        
        const imgRect = imgElement.getBoundingClientRect();
        
        // 获取预览元素尺寸
        const previewWidth = previewEl.offsetWidth;
        const previewHeight = previewEl.offsetHeight;
        
        // 获取窗口尺寸
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // 设置边距
        const margin = 4; // 设置预览与原图边距为4px
        
        // 计算最佳位置，优先放在原图右侧
        let left = imgRect.right + margin;
        let top = imgRect.top;
        
        // 检查右侧空间是否足够
        if (left + previewWidth > windowWidth - margin) {
          // 右侧空间不足，尝试左侧
          left = imgRect.left - previewWidth - margin;
          
          // 如果左侧也不够，则放在上方或下方
          if (left < margin) {
            // 左侧空间不足，尝试下方
            left = imgRect.left;
            top = imgRect.bottom + margin;
            
            // 如果下方空间不足，尝试上方
            if (top + previewHeight > windowHeight - margin) {
              top = imgRect.top - previewHeight - margin;
              
              // 如果上方空间也不足，则放在右下角且大小适应
              if (top < margin) {
                left = windowWidth - previewWidth - margin;
                top = windowHeight - previewHeight - margin;
              }
            }
          }
        }
        
        // 确保不超出屏幕
        left = Math.max(margin, Math.min(windowWidth - previewWidth - margin, left));
        top = Math.max(margin, Math.min(windowHeight - previewHeight - margin, top));
        
        // 更新位置
        hoverPreview.style = {
          top: `${top}px`,
          left: `${left}px`
        };
      });
    }
    
    const hideImagePreview = () => {
      hoverPreview.show = false;
      hoverPreview.url = '';
      hoverPreview.name = '';
      hoverPreview.size = '';
    }
    
    // 格式化文件大小
    const formatFileSize = (size) => {
      if (size < 1024) {
        return size + ' B';
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + ' KB';
      } else {
        return (size / (1024 * 1024)).toFixed(2) + ' MB';
      }
    }
    
    // 拖拽排序
    const handleDragStart = (e, index) => {
      dragIndex.value = index;
      isDragging.value = true; // 标记开始拖拽
      // 强制隐藏悬浮预览
      hideImagePreview();
      e.dataTransfer.effectAllowed = 'move';
      // 设置拖拽图像
      const img = new Image();
      e.dataTransfer.setDragImage(img, 0, 0);
      
      // 添加视觉指示
      e.target.classList.add('dragging');
    }
    
    const handleDragOver = (e, index) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      // 当拖过不同的项时添加视觉指示
      const items = document.querySelectorAll('.image-preview-item');
      items.forEach(item => item.classList.remove('drag-over'));
      e.currentTarget.classList.add('drag-over');
    }
    
    const handleDrop = (e, index) => {
      e.preventDefault();
      // 移除所有视觉指示
      const items = document.querySelectorAll('.image-preview-item');
      items.forEach(item => {
        item.classList.remove('dragging');
        item.classList.remove('drag-over');
      });
      
      // 如果拖到自己身上，不做任何改变
      if (dragIndex.value === index) return;
      
      // 重新排序图片
      const draggedItem = fileList.value[dragIndex.value];
      const newFileList = [...fileList.value];
      
      // 从原位置删除
      newFileList.splice(dragIndex.value, 1);
      // 插入到新位置
      newFileList.splice(index, 0, draggedItem);
      
      // 更新fileList
      fileList.value = newFileList;
      dragIndex.value = -1;

      // 拖拽结束
      isDragging.value = false;
    }
    
    const handleImageMouseDown = (e) => {
      // 立即隐藏悬浮预览
      hideImagePreview();
      // 设置全局mouseup事件监听，以防止鼠标在组件外释放
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    const handleImageMouseUp = (e) => {
      // 鼠标松开后，如果鼠标在图片上，并且不在拖拽状态，则重新触发预览
      const file = fileList.value[fileList.value.findIndex((_, i) => 
        e.currentTarget === document.querySelectorAll('.image-preview-item')[i])];
      
      if (file && !isDragging.value && previewEnabled.value) {
        showImagePreview(file);
      }
    }
    
    // 处理全局鼠标释放事件
    const handleGlobalMouseUp = () => {
      // 移除全局监听
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      
      // 如果不在拖拽状态，重置isDragging
      if (dragIndex.value === -1) {
        isDragging.value = false;
      }
    }
    
    const removeImageAt = (index) => {
      if (index >= 0 && index < fileList.value.length) {
        // 如果文件有URL对象，释放它
        const file = fileList.value[index]
        if (file.url && file.url.startsWith('blob:')) {
          URL.revokeObjectURL(file.url)
        }
        
        // 从数组中移除文件
        fileList.value.splice(index, 1)
      }
    }
    
    // 表单提交
    const handleNameEnter = () => {
      // 处理按下Enter键时的操作
      if (fileList.value.length > 0) {
        submitForm()
      }
    }
    
    // 将图片合并为PDF - 在表单提交时会用到这个函数
    const mergeImagesToPdf = async () => {
      return new Promise(async (resolve, reject) => {
        try {
          // 直接使用fileList的当前顺序（已经是用户调整后的顺序）
          const sortedImages = [...fileList.value]
          
          const totalImages = sortedImages.length
          // 创建PDF实例，指定具体的单位和格式
          const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: 'a4',
            compress: true
          })
          
          // 处理每张图片
          for (let i = 0; i < totalImages; i++) {
            const file = sortedImages[i]
            
            // 更新进度
            processingProgress.value = Math.round((i / totalImages) * 90) // 最多到90%，留10%给最后的PDF生成
            
            // 加载图片为base64，使用PNG格式而非默认的JPEG格式
            const imgData = await loadImageAsDataURL(file.raw)
            
            // 获取图片尺寸
            const imgProps = await getImageDimensions(imgData)
            
            // 不是第一页就添加新页
            if (i > 0) {
              doc.addPage()
            }
            
            // 设置页面背景色为白色，避免透明背景图片出现空白问题
            const pageWidth = doc.internal.pageSize.getWidth()
            const pageHeight = doc.internal.pageSize.getHeight()
            
            // 添加白色背景
            doc.setFillColor(255, 255, 255)
            doc.rect(0, 0, pageWidth, pageHeight, 'F')
            
            let imgWidth = imgProps.width
            let imgHeight = imgProps.height
            
            // 缩放图片以适应页面，保持比例
            if (imgWidth > pageWidth) {
              const ratio = pageWidth / imgWidth
              imgWidth = pageWidth
              imgHeight = imgHeight * ratio
            }
            
            if (imgHeight > pageHeight) {
              const ratio = pageHeight / imgHeight
              imgHeight = pageHeight
              imgWidth = imgWidth * ratio
            }
            
            // 居中图片
            const x = (pageWidth - imgWidth) / 2
            const y = (pageHeight - imgHeight) / 2
            
            // 添加图片到PDF, 使用PNG格式并设置压缩质量
            doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight, undefined, 'FAST')
          }
          
          // 生成PDF Blob
          processingProgress.value = 95
          const pdfBlob = doc.output('blob')
          
          // 创建File对象
          const fileName = `${uploadForm.customerName}_征信报告_${new Date().toISOString().slice(0, 10)}.pdf`
          const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' })
          
          processingProgress.value = 100
          resolve(pdfFile)
        } catch (error) {
          console.error('合并图片为PDF时出错:', error)
          reject(error)
        }
      })
    }
    
    // 辅助函数：加载图片为DataURL，使用PNG格式
    const loadImageAsDataURL = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          // 创建图像对象
          const img = new Image()
          img.onload = () => {
            // 创建canvas元素
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            
            // 获取绘图上下文并设置白色背景
            const ctx = canvas.getContext('2d')
            
            // 填充白色背景
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            // 在白色背景上绘制图像
            ctx.drawImage(img, 0, 0)
            
            // 将canvas转为PNG格式的dataURL
            const dataURL = canvas.toDataURL('image/png', 1.0)
            resolve(dataURL)
          }
          img.onerror = reject
          img.src = e.target.result
        }
        reader.onerror = (e) => reject(e)
        reader.readAsDataURL(file)
      })
    }
    
    // 辅助函数：获取图片尺寸
    const getImageDimensions = (dataUrl) => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height
          })
        }
        img.onerror = reject
        img.src = dataUrl
      })
    }
    
    // 处理内容滚动
    const handleContentScroll = (e) => {
      const header = document.querySelector('.content-panel .panel-header')
      if (header) {
        // 当滚动位置大于0时添加scrolled类
        if (e.target.scrollTop > 0) {
          header.classList.add('scrolled')
        } else {
          header.classList.remove('scrolled')
        }
      }
    }
    
    // 生命周期钩子
    onMounted(() => {
      // 监听右侧内容区域的滚动事件
      const panelContent = document.querySelector('.content-panel .panel-content')
      if (panelContent) {
        panelContent.addEventListener('scroll', handleContentScroll)
      }
    })
    
    onBeforeUnmount(() => {
      // 移除滚动事件监听
      const panelContent = document.querySelector('.content-panel .panel-content')
      if (panelContent) {
        panelContent.removeEventListener('scroll', handleContentScroll)
      }
      
      // 清理所有blob URL
      fileList.value.forEach(file => {
        if (file.url && file.url.startsWith('blob:')) {
          URL.revokeObjectURL(file.url)
        }
      })
    })
    
    // 表单提交
    const submitForm = async () => {
      if (fileList.value.length === 0) {
        ElMessage.warning('请先上传文件')
        return
      }
      
      // 表单验证
      try {
        await uploadFormRef.value.validate()
      } catch (error) {
        // 表单验证失败，聚焦到客户姓名输入框
        nextTick(() => {
          const customerNameInput = uploadFormRef.value.$el.querySelector('input')
          if (customerNameInput) {
            customerNameInput.focus()
          }
        })
        return // 表单验证失败，不继续执行
      }
      
      uploading.value = true
      
      try {
        // 如果是图片模式，需要先将图片合并为PDF
        let fileToUpload = null
        
        if (fileUploadType.value === 'pdf') {
          fileToUpload = fileList.value[0].raw
        } else {
          // 显示处理进度
          processingImages.value = true
          processingProgress.value = 0
          
          // 合并图片为PDF
          fileToUpload = await mergeImagesToPdf()
          
          processingImages.value = false
          processingProgress.value = 100
        }
        
        // 准备提交数据，应该包含用户名和文件
        const formData = {
          customerName: uploadForm.customerName,
          file: fileToUpload,
          fileList: fileList.value,
          fileType: fileUploadType.value
        }
        
        // 触发提交事件，将数据传递给父组件
        emit('submit', formData)
      } catch (error) {
        ElMessage.error('处理失败，请重试')
        console.error(error)
        processingImages.value = false
      } finally {
        uploading.value = false
      }
    }
    
    // 监听文件类型变化
    watch(fileUploadType, (newType, oldType) => {
      if (newType !== oldType && fileList.value.length > 0) {
        // 切换文件类型时，询问用户是否清空已上传文件
        ElMessageBox.confirm('切换文件类型将清空已上传的文件，是否继续？', '操作提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          resetFileList()
        }).catch(() => {
          // 用户取消，恢复为原来的类型
          fileUploadType.value = oldType
        })
      }
    })
    
    return {
      fileList,
      fileUploadType,
      isDragover,
      uploadRef,
      uploadFormRef,
      uploading,
      uploadForm,
      uploadRules,
      fileAcceptType,
      fileUploadCountText,
      processingImages,
      processingProgress,
      previewEnabled,
      hoverPreview,
      dragIndex,
      isDragging,
      
      // 方法
      handleFileChange,
      handleFileRemove,
      resetFileList,
      handleFileDrop,
      showImagePreview,
      hideImagePreview,
      handleDragStart,
      handleDragOver,
      handleDrop,
      handleImageMouseDown,
      handleImageMouseUp,
      removeImageAt,
      handleNameEnter,
      submitForm
    }
  }
}
</script> 

<style scoped>
/* 以下样式使用scoped属性，隔离样式作用域 */

/* ========== 1. 页面布局基础样式 ========== */
.credit-analyse-form {
  width: 100%;
  height: 100%;
  padding: 20px;
  background-color: #f5f7fa;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.form-container {
  width: 100%;
  max-width: 1000px;
  height: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  box-sizing: border-box;
  overflow: hidden;
}

/* ========== 2. 面板通用样式 ========== */
/* 左侧输入面板 */
.input-panel {
  flex: 1;  
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid #dcdfe6;
}

/* 右侧内容面板 */
.content-panel {
  width: 350px; 
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.reference-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

/* ========== 3. 面板头部样式 ========== */
.panel-header {
  padding: 0;
  border-bottom: 1px solid #eee;
  background-color: #f8f9fa;
  height: 50px;
  box-sizing: border-box;
  position: relative;
  display: flex;
  align-items: center;
  padding-left: 20px;
  padding-right: 20px;
}

.panel-title {
  padding: 0;
  color: #000000;
  font-size: 18px;
  font-weight: 500;
  line-height: 60px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 右侧内容面板标题悬浮 */
.content-panel .panel-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #f8f9fa;
  transition: box-shadow 0.3s ease;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 当滚动时增强阴影效果 */
.content-panel .panel-header.scrolled {
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

/* ========== 4. 面板内容样式 ========== */
.panel-content {
  padding: 0 20px 15px 20px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #dcdfe6 #f5f7fa;
  flex: 1;
}

/* 滚动条样式 */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-track {
  background-color: #f5f7fa;
}

/* 添加滚动条悬停样式 */
.panel-content::-webkit-scrollbar-thumb:hover {
  background-color: #c0c4cc;
}

.description-hint {
  color: #606266;
  font-size: 14px;
  margin-bottom: 12px;
}

/* ========== 5. 右侧参考内容样式 ========== */
.reference-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 4px;
}

.reference-group {
  min-width: 0;
}

.reference-group h4 {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
}

.reference-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reference-item {
  display: flex;
  align-items: baseline;
  font-size: 14px;
}

.reference-item::before {
  content: "•"; /* 使用圆点作为项目符号 */
  color: #606266; 
  font-size: 18px; /* 稍微调大项目符号 */
  margin-right: 6px; /* 添加项目符号与文本之间的间距 */
  line-height: 1; /* 确保垂直对齐 */
}

.item-label {
  color: #606266;
  min-width: 70px;
  flex-shrink: 0;
  white-space: nowrap;
}

/* 示例区域样式 */
.tips-section {
  padding-top: 16px;
}

.tips-block {
  margin-top: 16px;
}

.tips-block h4 {
  font-size: 14px;
  color: #a0a9b6;
  margin-bottom: 8px;
}

.tips-content {
  margin: 0;
  padding: 12px 16px;
  background-color: #fcf3e6;
  border-left: 4px solid #fcd34d;
  border-radius: 8px;
  color: #b45309;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
}

/* ========== 6. 文件上传相关样式 ========== */

.file-type-selector {
  margin: 14px 0;
}

.file-type-cards {
  display: flex;
  gap: 16px;
}

.file-type-card {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 4px;
  /* background-color: #f8f9fa; */
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.file-type-card:hover:not(.disabled) {
  border-color: #1b68de;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.file-type-card.active {
  background-color: #ecf5ff;
  border-color: #1b68de;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
}

.file-type-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.file-type-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #e6f1ff;
  color: #1b68de;
  margin: 0 8px;
  font-size: 18px;
}

.file-type-card.active .file-type-icon {
  background-color: #1b68de;
  color: white;
}

.file-type-info {
  flex: 1;
}

.file-type-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.file-type-desc {
  font-size: 12px;
  color: #909399;
}

.file-type-desc-tip {
  color: #000000;
  font-weight: 500;
}

/* 上传区域 */
.upload-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px 0;
}

.upload-layout {
  display: flex;
  min-height: 350px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.upload-main {
  flex: 2;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.upload-title {
  font-size: 20px;
  margin: 0 0 24px 0;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
}

.upload-sidebar {
  flex: 1;
  background: #f5f7fa;
  padding: 24px;
  border-left: 1px solid #ebeef5;
}

.upload-dropzone {
  position: relative;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  transition: all 0.3s;
  /* background: #ecf5ff; */
  margin-bottom: 20px;
  min-height: 180px; /* 确保上传区有足够的高度 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-dropzone:hover {
  background-color: #ecf5ff;
  border: 1px dashed #1b68de;
}

.upload-dropzone.is-dragover {
  border-color: #1b68de;
  background: #ecf5ff;
}

.upload-dropzone.has-file {
  border-color: #67C23A;
  background: #f0f9eb;
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload) {
  width: 100%;
  display: block;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  height: auto;
  padding: 40px 20px;
  background: transparent;
  border: none;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-content .upload-icon {
  font-size: 48px;
  color: #1b68de;
  margin: 0;
}

.upload-text {
  font-size: 16px;
  color: #303133;
  font-weight: 500;
}

.upload-hint {
  font-size: 14px;
  color: #909399;
}

.upload-text em {
  color: #1b68de;
  font-style: normal;
  /* text-decoration: underline; */
}

.continue-upload-hit {
  color: #1b68de;
  font-style: normal;
  margin-left: 8px;
  /* text-decoration: underline; */
}

.upload-text strong {
  color: #67C23A;
}

.upload-actions {
  display: flex;
  margin-top: 16px;
  justify-content: center;
  gap: 16px;
}

/* 清除文件按钮样式 */
.clear-files-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #feeeee;
  color: #f56c6c;
  border-radius: 4px;
  border: 1px solid #f56c6c;
  padding: 4px 8px;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  height: 24px; /* 固定高度 */
  box-sizing: border-box; /* 确保padding不会增加元素高度 */
  transition: all 0.3s;
  font-size: 12px;
}

.clear-files-button:hover {
  background-color: #f56c6c;
  color: #fff;
}

.clear-files-button .clear-text {
  display: none;
  white-space: nowrap;
  line-height: 1; /* 确保文本行高一致 */
}

.clear-files-button:hover .clear-text {
  display: inline;
}

/* ========== 7. 图片预览相关样式 ========== */
.image-preview-container {
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px 16px;
  background-color: #f8f8f8;
}

.preview-title {
  font-size: 16px;
  margin: 0 0 8px 0;
  color: #303133;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.image-preview-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  max-height: 300px;
  overflow-y: auto;
  padding: 4px;
  scrollbar-width: thin; /* 添加滚动条宽度为thin */
}

/* 为WebKit浏览器(Chrome/Safari等)自定义滚动条 */
.image-preview-list::-webkit-scrollbar {
  width: 6px;
}

.image-preview-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.image-preview-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.image-preview-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.image-preview-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-preview-wrapper {
  position: relative;
  width: 100%;
  height: 100px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-preview-actions {
  position: absolute;
  top: 4px;
  right: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-preview-wrapper:hover .image-preview-actions {
  opacity: 1;
}

.remove-image-btn {
  padding: 4px !important;
  font-size: 12px !important;
}

.image-preview-index {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 12px;
}

.image-preview-name {
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
  width: 100%;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 图片排序提示样式 */
.sort-hint {
  font-size: 14px;
  font-weight: normal;
  color: #909399;
  margin-left: 4px;
}

/* 拖拽相关样式 */
.image-preview-item {
  cursor: grab;
  transition: transform 0.2s, box-shadow 0.2s;
}

.image-preview-item.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.image-preview-item.drag-over {
  transform: scale(1.05);
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.6);
}

/* 悬浮预览样式 */
.image-hover-preview {
  position: fixed;
  z-index: 9999;
  padding: 4px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: min(1000px, 80vw); /* 最大宽度为1000px或视口宽度的80%，取较小值 */
  max-height: min(1000px, 80vh); /* 最大高度为1000px或视口高度的80%，取较小值 */
  overflow: hidden;
  pointer-events: none;
}

.image-hover-preview img {
  width: 100%;
  object-fit: contain;
  max-height: min(1000px, calc(80vh - 30px)); /* 减去信息栏的高度 */
}

.hover-preview-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #606266;
  margin-top: 2px;
}

/* 预览开关样式 */
.preview-switch {
  display: flex;
  align-items: center;
  margin-left: auto;
  gap: 8px;
}

.switch-label {
  font-size: 14px;
  font-weight: normal;
  color: #606266;
}

/* 响应式调整 */
@media (max-width: 992px) {
  .form-container {
    flex-direction: column;
  }
  
  .input-panel, .content-panel {
    width: 100%;
    flex: none;
    border-right: none;
    border-bottom: 1px solid #dcdfe6;
  }
  
  .content-panel {
    border-bottom: none;
  }
  
  .reference-grid {
    grid-template-columns: 1fr;
  }
  
  .tips-block {
    margin-top: 8px;
  }
  
  .tips-block h4 {
    margin-bottom: 6px;
  }
}
</style> 