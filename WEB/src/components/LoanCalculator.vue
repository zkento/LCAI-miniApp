// 最后修改时间: 2024-07-17
<template>
  <div class="LoanCalculator">
    <div class="calculator-header">
      <h1 class="calculator-title">良策AI贷款计算器</h1>
      <el-button type="text" @click="closeWindow" class="close-btn">
        <el-icon><Close /></el-icon>
      </el-button>
    </div>
    <div class="form-container">
      <!-- 左侧输入区 -->
      <div class="input-panel">
        <div class="panel-header">
          <h2 class="panel-title">贷款计算项</h2>
          <el-button 
            type="primary" 
            size="small" 
            @click="resetAllFields"
            class="reset-button">
            <el-icon><RefreshRight /></el-icon> 重置
          </el-button>
        </div>
        <div class="panel-content">
          <!-- 基本参数表单 -->
          <el-form :model="formData" ref="calculatorForm" label-position="top" class="loan-form">
            <!-- 贷款方式选择卡片 -->
            <div class="form-card">
              <div class="loan-selector">
                <div 
                  class="loan-type-item" 
                  :class="{ 'active': formData.loanType === 'mortgage' }"
                  @click="formData.loanType = 'mortgage'; handleLoanTypeChange('mortgage')">
                  <div class="icon-wrapper mortgage-icon">
                    <el-icon><House /></el-icon>
                  </div>
                  <span>按揭贷款</span>
                </div>
                <div 
                  class="loan-type-item" 
                  :class="{ 'active': formData.loanType === 'secured' }"
                  @click="formData.loanType = 'secured'; handleLoanTypeChange('secured')">
                  <div class="icon-wrapper secured-icon">
                    <el-icon><Money /></el-icon>
                  </div>
                  <span>抵押贷款</span>
                </div>
                <div 
                  class="loan-type-item" 
                  :class="{ 'active': formData.loanType === 'credit' }"
                  @click="formData.loanType = 'credit'; handleLoanTypeChange('credit')">
                  <div class="icon-wrapper credit-icon">
                    <el-icon><CreditCard /></el-icon>
                  </div>
                  <span>信用贷款</span>
                </div>
              </div>
              
              <!-- 按揭贷款类型选择卡片（仅在选择按揭贷款时显示） -->
              <div v-if="formData.loanType === 'mortgage'" class="mortgage-subtype-card">
                <div class="mortgage-type-selector">
                  <div 
                    class="mortgage-type-item" 
                    :class="{ 'active': formData.mortgage.mortgageType === 'fund' }"
                    @click="formData.mortgage.mortgageType = 'fund'; handleMortgageTypeChange('fund')">
                    <span>公积金贷款</span>
                  </div>
                  <div 
                    class="mortgage-type-item" 
                    :class="{ 'active': formData.mortgage.mortgageType === 'commercial' }"
                    @click="formData.mortgage.mortgageType = 'commercial'; handleMortgageTypeChange('commercial')">
                    <span>商业贷款</span>
                  </div>
                  <div 
                    class="mortgage-type-item" 
                    :class="{ 'active': formData.mortgage.mortgageType === 'mixed' }"
                    @click="formData.mortgage.mortgageType = 'mixed'; handleMortgageTypeChange('mixed')">
                    <span>组合贷款</span>
                  </div>
                </div>
              </div>
            </div>
              
            <!-- 按揭贷款特定字段 -->
            <template v-if="formData.loanType === 'mortgage'">
              <div v-if="formData.mortgage.mortgageType">

                <!-- 公积金贷款信息 -->
                <template v-if="formData.mortgage.mortgageType === 'fund'">
                  <div class="form-card">
                    <div class="card-title fund-title">
                      <span>公积金贷款信息</span>
                      <div class="calculation-mode-switch">
                        <span class="switch-label">按房屋总价</span>
                        <el-switch
                          v-model="formData.mortgage.calculationMode"
                          active-value="housePrice"
                          inactive-value="loanAmount"
                          @change="handleCalculationModeChange"
                        ></el-switch>
                      </div>
                    </div>
                    <div class="param-fields-grid">
                      <!-- 房屋总价相关字段(按房屋总价模式) -->
                      <template v-if="formData.mortgage.calculationMode === 'housePrice'">
                        <div class="field-item">
                          <div class="field-label">房屋总价 (万元)</div>
                          <div class="field-input">
                            <el-input-number 
                              v-model="formData.mortgage.housePrice" 
                              :min="0" 
                              :max="5000" 
                              :precision="2" 
                              :step="10" 
                              controls-position="right"
                              @focus="handleInputFocus"
                              @change="handleHousePriceChange"
                              placeholder="请输入"
                              class="custom-input-number"></el-input-number>
                          </div>
                        </div>
                        
                        <div class="field-item">
                          <div class="field-label">首付比例 (%)</div>
                          <div class="field-input">
                            <el-input-number 
                              v-model="formData.mortgage.downPaymentRatio" 
                              :min="0" 
                              :max="100" 
                              :precision="1" 
                              :step="5" 
                              controls-position="right"
                              @focus="handleInputFocus"
                              @change="handleDownPaymentRatioChange"
                              placeholder="请输入"
                              :disabled="!formData.mortgage.housePrice || formData.mortgage.housePrice === 0"
                              class="custom-input-number"></el-input-number>
                          </div>
                        </div>
                        
                        <div class="field-item">
                          <div class="field-label">首付金额 (万元)</div>
                          <div class="field-input">
                            <el-input-number 
                              v-model="formData.mortgage.downPaymentAmount" 
                              :min="0" 
                              :max="formData.mortgage.housePrice || 0" 
                              :precision="2" 
                              :step="10" 
                              controls-position="right"
                              @focus="handleInputFocus"
                              @change="handleDownPaymentAmountChange"
                              placeholder="请输入"
                              :disabled="!formData.mortgage.housePrice || formData.mortgage.housePrice === 0"
                              class="custom-input-number"></el-input-number>
                          </div>
                        </div>
                        
                        <!-- 分割线 -->
                        <div class="field-item full-width">
                          <div class="divider">
                            <span>贷款信息</span>
                          </div>
                        </div>
                      </template>
                      
                      <div class="field-item">
                        <div class="field-label">贷款金额 (万元)</div>
                        <div class="field-input">
                          <el-input-number 
                            v-model="formData.mortgage.fundLoanAmount" 
                            :min="0" 
                            :max="999" 
                            :precision="2" 
                            :step="10" 
                            controls-position="right"
                            @focus="handleInputFocus"
                            @change="handleFundLoanAmountChange"
                            placeholder="请输入"
                            :disabled="formData.mortgage.calculationMode === 'housePrice' && (!formData.mortgage.housePrice || formData.mortgage.housePrice === 0)"
                            class="custom-input-number"></el-input-number>
                        </div>
                      </div>
                      <div class="field-item">
                        <div class="field-label">贷款利率 (%)</div>
                        <div class="field-input">
                          <el-input-number 
                            v-model="formData.mortgage.fundRate" 
                            :min="1" 
                            :max="20" 
                            :precision="2" 
                            :step="0.1" 
                            controls-position="right"
                            @focus="handleInputFocus"
                            placeholder="请输入"
                            class="custom-input-number"></el-input-number>
                        </div>
                      </div>
                      <div class="field-item full-width">
                        <div class="field-label">贷款期限</div>
                        <div class="loan-term-slider">
                          <el-tooltip
                            content="可点击修改"
                            placement="top"
                            :disabled="editingTerm.editing && editingTerm.type === 'mortgage'"
                            :enterable="false"
                            popper-class="term-tooltip"
                          >
                            <div class="term-value" @click="handleTermClick('mortgage')">
                              <template v-if="!editingTerm.editing || editingTerm.type !== 'mortgage'">
                                {{ formData.mortgage.mortgageTerm }}个月 ({{ Math.floor(formData.mortgage.mortgageTerm/12) }}年{{ formData.mortgage.mortgageTerm%12 }}个月)
                              </template>
                              <input 
                                v-else
                                type="text" 
                                class="term-input" 
                                :value="editingTerm.value"
                                @blur="handleTermEdit"
                                @keyup.enter="handleTermEdit"
                                @keyup.esc="handleTermEditCancel"
                                placeholder="请输入"
                                v-focus
                                inputmode="numeric"
                                pattern="[0-9]*"
                              />
                            </div>
                          </el-tooltip>
                          <el-slider 
                            v-model="formData.mortgage.mortgageTerm" 
                            :min="12" 
                            :max="360" 
                            :step="12" 
                            :marks="{60: '5年', 120: '10年', 180: '15年', 240: '20年', 300: '25年', 360: '30年'}"
                            class="term-slider">
                          </el-slider>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- 商业贷款信息 -->
                <template v-if="formData.mortgage.mortgageType === 'commercial'">
                  <div class="form-card">
                    <div class="card-title commercial-title">
                      <span>商业贷款信息</span>
                      <div class="calculation-mode-switch">
                        <span class="switch-label">按房屋总价</span>
                        <el-switch
                          v-model="formData.mortgage.calculationMode"
                          active-value="housePrice"
                          inactive-value="loanAmount"
                          @change="handleCalculationModeChange"
                        ></el-switch>
                      </div>
                    </div>
                    <div class="param-fields-grid">
                      <!-- 房屋总价相关字段(按房屋总价模式) -->
                      <template v-if="formData.mortgage.calculationMode === 'housePrice'">
                        <div class="field-item">
                          <div class="field-label">房屋总价 (万元)</div>
                          <div class="field-input">
                            <el-input-number 
                              v-model="formData.mortgage.housePrice" 
                              :min="0" 
                              :max="5000" 
                              :precision="2" 
                              :step="10" 
                              controls-position="right"
                              @focus="handleInputFocus"
                              @change="handleHousePriceChange"
                              placeholder="请输入"
                              class="custom-input-number"></el-input-number>
                          </div>
                        </div>
                        
                        <div class="field-item">
                          <div class="field-label">首付比例 (%)</div>
                          <div class="field-input">
                            <el-input-number 
                              v-model="formData.mortgage.downPaymentRatio" 
                              :min="0" 
                              :max="100" 
                              :precision="1" 
                              :step="5" 
                              controls-position="right"
                              @focus="handleInputFocus"
                              @change="handleDownPaymentRatioChange"
                              placeholder="请输入"
                              :disabled="!formData.mortgage.housePrice || formData.mortgage.housePrice === 0"
                              class="custom-input-number"></el-input-number>
                          </div>
                        </div>
                        
                        <div class="field-item">
                          <div class="field-label">首付金额 (万元)</div>
                          <div class="field-input">
                            <el-input-number 
                              v-model="formData.mortgage.downPaymentAmount" 
                              :min="0" 
                              :max="formData.mortgage.housePrice || 0" 
                              :precision="2" 
                              :step="10" 
                              controls-position="right"
                              @focus="handleInputFocus"
                              @change="handleDownPaymentAmountChange"
                              placeholder="请输入"
                              :disabled="!formData.mortgage.housePrice || formData.mortgage.housePrice === 0"
                              class="custom-input-number"></el-input-number>
                          </div>
                        </div>
                        
                        <!-- 分割线 -->
                        <div class="field-item full-width">
                          <div class="divider">
                            <span>贷款信息</span>
                          </div>
                        </div>
                      </template>
                      
                      <div class="field-item">
                        <div class="field-label">贷款金额 (万元)</div>
                        <div class="field-input">
                          <el-input-number 
                            v-model="formData.mortgage.commercialLoanAmount" 
                            :min="0" 
                            :max="99999" 
                            :precision="2" 
                            :step="10" 
                            controls-position="right"
                            @focus="handleInputFocus"
                            @change="handleCommercialLoanAmountChange"
                            placeholder="请输入"
                            :disabled="formData.mortgage.calculationMode === 'housePrice' && (!formData.mortgage.housePrice || formData.mortgage.housePrice === 0)"
                            class="custom-input-number"></el-input-number>
                        </div>
                      </div>
                      <div class="field-item">
                        <div class="field-label">贷款利率 (%)</div>
                        <div class="field-input">
                          <el-input-number 
                            v-model="formData.mortgage.commercialRate" 
                            :min="1" 
                            :max="20" 
                            :precision="2" 
                            :step="0.1" 
                            controls-position="right"
                            @focus="handleInputFocus"
                            placeholder="请输入"
                            class="custom-input-number"></el-input-number>
                        </div>
                      </div>
                      <div class="field-item full-width">
                        <div class="field-label">贷款期限</div>
                        <div class="loan-term-slider">
                          <el-tooltip
                            content="可点击修改"
                            placement="top"
                            :disabled="editingTerm.editing && editingTerm.type === 'mortgage'"
                            :enterable="false"
                            popper-class="term-tooltip"
                          >
                            <div class="term-value" @click="handleTermClick('mortgage')">
                              <template v-if="!editingTerm.editing || editingTerm.type !== 'mortgage'">
                                {{ formData.mortgage.mortgageTerm }}个月 ({{ Math.floor(formData.mortgage.mortgageTerm/12) }}年{{ formData.mortgage.mortgageTerm%12 }}个月)
                              </template>
                              <input 
                                v-else
                                type="text" 
                                class="term-input" 
                                :value="editingTerm.value"
                                @blur="handleTermEdit"
                                @keyup.enter="handleTermEdit"
                                @keyup.esc="handleTermEditCancel"
                                placeholder="请输入"
                                v-focus
                                inputmode="numeric"
                                pattern="[0-9]*"
                              />
                            </div>
                          </el-tooltip>
                          <el-slider 
                            v-model="formData.mortgage.mortgageTerm" 
                            :min="12" 
                            :max="360" 
                            :step="12" 
                            :marks="{60: '5年', 120: '10年', 180: '15年', 240: '20年', 300: '25年', 360: '30年'}"
                            class="term-slider">
                          </el-slider>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
                
                <!-- 组合贷款信息 -->
                <template v-if="formData.mortgage.mortgageType === 'mixed'">
                  <div class="form-card">
                    <div class="card-title mixed-title">
                      <span>组合贷款信息</span>
                      <div class="calculation-mode-switch">
                        <span class="switch-label">按房屋总价</span>
                        <el-switch
                          v-model="formData.mortgage.calculationMode"
                          active-value="housePrice"
                          inactive-value="loanAmount"
                          @change="handleCalculationModeChange"
                        ></el-switch>
                      </div>
                    </div>
                    <div class="param-fields-grid">
                      <!-- 房屋总价相关字段(按房屋总价模式) -->
                      <template v-if="formData.mortgage.calculationMode === 'housePrice'">
                        <div class="field-item">
                          <div class="field-label">房屋总价 (万元)</div>
                          <div class="field-input">
                            <el-input-number 
                              v-model="formData.mortgage.housePrice" 
                              :min="0" 
                              :max="5000" 
                              :precision="2" 
                              :step="10" 
                              controls-position="right"
                              @focus="handleInputFocus"
                              @change="handleHousePriceChange"
                              placeholder="请输入"
                              class="custom-input-number"></el-input-number>
                          </div>
                        </div>
                        
                        <div class="field-item">
                          <div class="field-label">首付比例 (%)</div>
                          <div class="field-input">
                            <el-input-number 
                              v-model="formData.mortgage.downPaymentRatio" 
                              :min="0" 
                              :max="100" 
                              :precision="1" 
                              :step="5" 
                              controls-position="right"
                              @focus="handleInputFocus"
                              @change="handleDownPaymentRatioChange"
                              placeholder="请输入"
                              :disabled="!formData.mortgage.housePrice || formData.mortgage.housePrice === 0"
                              class="custom-input-number"></el-input-number>
                          </div>
                        </div>
                        
                        <div class="field-item">
                          <div class="field-label">首付金额 (万元)</div>
                          <div class="field-input">
                            <el-input-number 
                              v-model="formData.mortgage.downPaymentAmount" 
                              :min="0" 
                              :max="formData.mortgage.housePrice || 0" 
                              :precision="2" 
                              :step="10" 
                              controls-position="right"
                              @focus="handleInputFocus"
                              @change="handleDownPaymentAmountChange"
                              placeholder="请输入"
                              :disabled="!formData.mortgage.housePrice || formData.mortgage.housePrice === 0"
                              class="custom-input-number"></el-input-number>
                          </div>
                        </div>
                        
                        <div class="field-item">
                          <div class="field-label">总贷款金额 (万元)</div>
                          <div class="field-input">
                            <el-input-number 
                              v-model="formData.mortgage.totalLoanAmount" 
                              :min="0" 
                              :max="formData.mortgage.calculationMode === 'housePrice' ? (formData.mortgage.housePrice || 0) : undefined" 
                              :precision="2" 
                              :step="10" 
                              controls-position="right"
                              @focus="handleInputFocus"
                              @change="handleTotalLoanAmountChange"
                              placeholder="请输入"
                              :disabled="formData.mortgage.calculationMode === 'housePrice' && (!formData.mortgage.housePrice || formData.mortgage.housePrice === 0)"
                              class="custom-input-number"></el-input-number>
                          </div>
                        </div>
                        
                        <!-- 分割线 -->
                        <div class="field-item full-width">
                          <div class="divider">
                            <span>贷款信息</span>
                          </div>
                        </div>
                      </template>
                      
                      <div class="field-item">
                        <div class="field-label">公积金贷款金额 (万元)</div>
                        <div class="field-input">
                          <el-input-number 
                            v-model="formData.mortgage.fundLoanAmount" 
                            :min="0" 
                            :max="999" 
                            :precision="2" 
                            :step="10" 
                            controls-position="right"
                            @focus="handleInputFocus"
                            @change="handleFundLoanAmountChange"
                            placeholder="请输入"
                            :disabled="formData.mortgage.calculationMode === 'housePrice' && (!formData.mortgage.housePrice || formData.mortgage.housePrice === 0)"
                            class="custom-input-number"></el-input-number>
                        </div>
                      </div>
                      <div class="field-item">
                        <div class="field-label">公积金贷款利率 (%)</div>
                        <div class="field-input">
                          <el-input-number 
                            v-model="formData.mortgage.fundRate" 
                            :min="1" 
                            :max="20" 
                            :precision="2" 
                            :step="0.1" 
                            controls-position="right"
                            @focus="handleInputFocus"
                            placeholder="请输入"
                            class="custom-input-number"></el-input-number>
                        </div>
                      </div>
                      <div class="field-item">
                        <div class="field-label">商业贷款金额 (万元)</div>
                        <div class="field-input">
                          <el-input-number 
                            v-model="formData.mortgage.commercialLoanAmount" 
                            :min="0" 
                            :max="99999" 
                            :precision="2" 
                            :step="10" 
                            controls-position="right"
                            @focus="handleInputFocus"
                            @change="handleCommercialLoanAmountChange"
                            placeholder="请输入"
                            :disabled="formData.mortgage.calculationMode === 'housePrice' && (!formData.mortgage.housePrice || formData.mortgage.housePrice === 0)"
                            class="custom-input-number"></el-input-number>
                        </div>
                      </div>
                      <div class="field-item">
                        <div class="field-label">商业贷款利率 (%)</div>
                        <div class="field-input">
                          <el-input-number 
                            v-model="formData.mortgage.commercialRate" 
                            :min="1" 
                            :max="20" 
                            :precision="2" 
                            :step="0.1" 
                            controls-position="right"
                            @focus="handleInputFocus"
                            placeholder="请输入"
                            class="custom-input-number"></el-input-number>
                        </div>
                      </div>
                      <div class="field-item" v-if="formData.mortgage.calculationMode === 'loanAmount'">
                        <div class="field-label">总贷款金额 (万元)</div>
                        <div class="field-input">
                          <el-input-number 
                            v-model="formData.mortgage.totalLoanAmount" 
                            :min="0" 
                            :max="formData.mortgage.calculationMode === 'housePrice' ? (formData.mortgage.housePrice || 0) : undefined" 
                            :precision="2" 
                            :step="10" 
                            controls-position="right"
                            @focus="handleInputFocus"
                            @change="handleTotalLoanAmountChange"
                            placeholder="请输入"
                            :disabled="formData.mortgage.calculationMode === 'housePrice' && (!formData.mortgage.housePrice || formData.mortgage.housePrice === 0)"
                            class="custom-input-number"></el-input-number>
                        </div>
                      </div>
                      <div class="field-item full-width">
                        <div class="field-label">贷款期限</div>
                        <div class="loan-term-slider">
                          <el-tooltip
                            content="可点击修改"
                            placement="top"
                            :disabled="editingTerm.editing && editingTerm.type === 'mortgage'"
                            :enterable="false"
                            popper-class="term-tooltip"
                          >
                            <div class="term-value" @click="handleTermClick('mortgage')">
                              <template v-if="!editingTerm.editing || editingTerm.type !== 'mortgage'">
                                {{ formData.mortgage.mortgageTerm }}个月 ({{ Math.floor(formData.mortgage.mortgageTerm/12) }}年{{ formData.mortgage.mortgageTerm%12 }}个月)
                              </template>
                              <input 
                                v-else
                                type="text" 
                                class="term-input" 
                                :value="editingTerm.value"
                                @blur="handleTermEdit"
                                @keyup.enter="handleTermEdit"
                                @keyup.esc="handleTermEditCancel"
                                placeholder="请输入"
                                v-focus
                                inputmode="numeric"
                                pattern="[0-9]*"
                              />
                            </div>
                          </el-tooltip>
                          <el-slider 
                            v-model="formData.mortgage.mortgageTerm" 
                            :min="12" 
                            :max="360" 
                            :step="12" 
                            :marks="{60: '5年', 120: '10年', 180: '15年', 240: '20年', 300: '25年', 360: '30年'}"
                            class="term-slider">
                          </el-slider>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </template>

          
            <!-- 抵押贷款和信用贷款公共字段 -->
            <template v-if="formData.loanType && formData.loanType !== 'mortgage'">
              <div class="form-card">
                <div class="card-title" :class="formData.loanType === 'secured' ? 'secured-title' : 'credit-title'">
                  <span>{{ formData.loanType === 'secured' ? '抵押贷款信息' : '信用贷款信息' }}</span>
                </div>
                <div class="param-fields-grid">
                  <div class="field-item">
                    <div class="field-label">贷款金额 (万元)</div>
                    <div class="field-input">
                      <el-input-number 
                        v-model="formData.loanAmount" 
                        :min="0" 
                        :max="formData.loanType === 'secured' ? 1000 : 200" 
                        :precision="2" 
                        :step="5" 
                        controls-position="right"
                        @focus="handleInputFocus"
                        placeholder="请输入"
                        class="custom-input-number"></el-input-number>
                    </div>
                  </div>
                  
                  <div class="field-item">
                    <div class="field-label">贷款利率 (%)</div>
                    <div class="field-input">
                      <el-input-number 
                        v-model="formData.interestRate" 
                        :min="1" 
                        :max="20" 
                        :precision="2" 
                        :step="0.1" 
                        controls-position="right"
                        @focus="handleInputFocus"
                        placeholder="请输入"
                        class="custom-input-number"></el-input-number>
                    </div>
                  </div>
                  
                  <div class="field-item full-width">
                    <div class="field-label">贷款期限 (月)</div>
                    <div class="loan-term-slider">
                      <el-tooltip
                        content="可点击修改"
                        placement="top"
                        :disabled="editingTerm.editing && editingTerm.type === 'common'"
                        :enterable="false"
                        popper-class="term-tooltip"
                      >
                        <div class="term-value" @click="handleTermClick('common')">
                          <template v-if="!editingTerm.editing || editingTerm.type !== 'common'">
                            {{ formData.loanTerm }}个月 
                            <span v-if="formData.loanTerm >= 12">({{ Math.floor(formData.loanTerm/12) }}年{{ formData.loanTerm%12 }}个月)</span>
                          </template>
                          <input 
                            v-else
                            type="text" 
                            class="term-input" 
                            :value="editingTerm.value"
                            @blur="handleTermEdit"
                            @keyup.enter="handleTermEdit"
                            @keyup.esc="handleTermEditCancel"
                            placeholder="请输入"
                            v-focus
                            inputmode="numeric"
                            pattern="[0-9]*"
                          />
                        </div>
                      </el-tooltip>
                      <el-slider 
                        v-model="formData.loanTerm" 
                        :min="1" 
                        :max="formData.loanType === 'secured' ? 120 : 60" 
                        :step="formData.loanType === 'secured' ? 1 : 1"
                        :marks="formData.loanType === 'secured' ? 
                          {12: '1年', 36: '3年', 60: '5年', 120: '10年'} : 
                          {6: '6月', 12: '1年', 24: '2年',36: '3年', 60: '5年'}"
                        class="term-slider">
                      </el-slider>
                    </div>

                    <div class="field-label">还款方式</div>
                    <div class="repayment-method-selector">
                      <div 
                        v-for="item in repaymentOptions" 
                        :key="item.value"
                        class="repayment-method-item" 
                        :class="{ 'active': formData.repaymentMethod.includes(item.value) }"
                        @click="toggleRepaymentMethod(item.value)">
                        <div class="method-checkbox">
                          <div class="checkbox-inner" v-if="formData.repaymentMethod.includes(item.value)"></div>
                        </div>
                        <span>{{ item.label }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </el-form>
        </div>
      </div>
      
      <!-- 右侧还款计划表区 -->
      <div class="content-panel">
        <div class="reference-content">
          <div class="panel-header">
            <div class="title-group">
              <h2 class="panel-title">贷款计算结果</h2>
              <!-- 组合贷款情况下的切换按钮 -->
              <div v-if="formData.loanType === 'mortgage'" class="loan-type-switch">
                <!-- 贷款类型切换 -->
                <div v-if="formData.mortgage.mortgageType === 'mixed'" class="custom-radio-group">
                  <div 
                    class="custom-radio-button" 
                    :class="{ 'active': activeLoanType === 'fund' }"
                    @click="activeLoanType = 'fund'; calculateRepaymentSchedule()"
                  >
                    公积金贷款
                  </div>
                  <div 
                    class="custom-radio-button" 
                    :class="{ 'active': activeLoanType === 'commercial' }"
                    @click="activeLoanType = 'commercial'; calculateRepaymentSchedule()"
                  >
                    商业贷款
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="panel-content">
            <!-- 还款计划表试算区域 -->
            <div v-if="canCalculateRepayment" class="repayment-calculator show">
              <!-- 贷款概览卡片 -->
              <div class="loan-summary-card">
                <div class="loan-info-grid">
                  <div class="loan-info-item">
                    <div class="info-label">贷款金额</div>
                    <div class="info-value">{{ calculationParams.loanAmount }}<span class="info-unit">万元</span></div>
                  </div>
                  <div class="loan-info-item">
                    <div class="info-label">贷款利率</div>
                    <div class="info-value">{{ calculationParams.interestRate }}<span class="info-unit">%</span></div>
                  </div>
                  <div class="loan-info-item">
                    <div class="info-label">贷款期限</div>
                    <div class="info-value">{{ calculationParams.loanTerm }}<span class="info-unit">月</span></div>
                  </div>
                  <div class="loan-info-item">
                    <div class="info-label">还款方式</div>
                    <div class="info-value method">{{ calculationParams.repaymentMethodLabel }}</div>
                  </div>
                </div>
              </div>
              
              <!-- 还款概览卡片 -->
              <div class="repayment-summary-card">
                <div class="card-title summary-title">
                  <div class="title-group">
                    <span>还款概览</span>
                    <!-- 还款方式切换移至此处 -->
                    <div 
                      v-if="formData.loanType === 'mortgage'"
                      class="repayment-method-switch"
                    >
                      <div 
                        class="repayment-method-button" 
                        :class="{ 'active': getCurrentRepaymentMethod() === 'equal_principal_interest' }"
                        @click="setCurrentRepaymentMethod('equal_principal_interest')"
                      >
                        等额本息
                      </div>
                      <div 
                        class="repayment-method-button" 
                        :class="{ 'active': getCurrentRepaymentMethod() === 'equal_principal' }"
                        @click="setCurrentRepaymentMethod('equal_principal')"
                      >
                        等额本金
                      </div>
                    </div>
                  </div>
                  <div class="summary-tip">
                    <template v-if="calculationParams.repaymentMethod === 'equal_principal' && calculationResult.schedule.length > 1">
                      每月还款金额递减 {{ formatCurrency(calculationResult.schedule[0].monthlyPayment - calculationResult.schedule[1].monthlyPayment) }} 元
                    </template>
                    <template v-else>
                      实际还款情况以银行审批为准
                    </template>
                  </div>
                </div>
                <div class="summary-card-content">
                  <div class="summary-item total-repayment">
                    <div class="summary-value">{{ formatCurrency(calculationResult.totalRepayment) }}<span class="summary-unit">元</span></div>
                    <div class="summary-label">总还款额</div>
                  </div>
                  <div class="summary-item total-interest">
                    <div class="summary-value">{{ formatCurrency(calculationResult.totalInterest) }}<span class="summary-unit">元</span></div>
                    <div class="summary-label">总利息</div>
                  </div>
                  <div class="summary-item monthly-payment">
                    <div class="summary-value">{{ calculationParams.repaymentMethod === 'equal_principal_interest' ? formatCurrency(calculationResult.monthlyPayment) : formatCurrency(calculationResult.schedule[0]?.monthlyPayment || 0) }}<span class="summary-unit">元</span></div>
                    <div class="summary-label">{{ calculationParams.repaymentMethod === 'equal_principal_interest' ? '月供' : '首月还款' }}</div>
                  </div>
                </div>
              </div>
              
              <!-- 还款计划表卡片 -->
              <div class="repayment-schedule-card">
                <div class="card-title schedule-title">
                  <span>还款计划表</span>
                </div>
                <div class="schedule-card-content">
                  <div class="schedule-table-wrapper">
                    <table class="schedule-table">
                      <thead>
                        <tr>
                          <th>期数</th>
                          <th>还款日期</th>
                          <th>月供(元)</th>
                          <th>本金(元)</th>
                          <th>利息(元)</th>
                          <th>剩余本金(元)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="item in calculationResult.schedule" :key="item.period" :class="{'first-year': item.period <= 12}">
                          <td>{{ item.period }}</td>
                          <td>{{ item.paymentDate }}</td>
                          <td>{{ formatCurrency(item.monthlyPayment) }}</td>
                          <td>{{ formatCurrency(item.principal) }}</td>
                          <td>{{ formatCurrency(item.interest) }}</td>
                          <td>{{ formatCurrency(item.remainingPrincipal) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 空白状态提示 -->
            <div v-else class="empty-state show">
              <div class="empty-state-content">
                <div class="empty-state-icon">
                  <el-icon><Document /></el-icon>
                </div>
                <h3 class="empty-state-title">开始您的贷款计算</h3>
                <p class="empty-state-desc">
                  <template v-if="formData.loanType">请完善左侧贷款计算项中的贷款金额、利率和期限等</template>
                  <template v-else>请先在贷款计算项中选择贷款方式，然后完善贷款信息</template>
                </p>
                <!-- <div class="empty-state-steps">
                  <div class="step-item">
                    <div class="step-number">1</div>
                    <div class="step-text">选择贷款方式</div>
                  </div>
                  <div class="step-connector"></div>
                  <div class="step-item">
                    <div class="step-number">2</div>
                    <div class="step-text">填写贷款信息</div>
                  </div>
                  <div class="step-connector"></div>
                  <div class="step-item">
                    <div class="step-number">3</div>
                    <div class="step-text">查看计算结果</div>
                  </div>
                </div> -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onBeforeUnmount, computed, nextTick, watch } from 'vue'
import { Close, RefreshRight, House, Money, CreditCard, Document, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'LoanCalculator',
  components: {
    Close,
    RefreshRight,
    House,
    Money,
    CreditCard,
    Document,
    Download
  },
  // 添加自定义指令
  directives: {
    focus: {
      mounted(el) {
        el.focus();
        el.select();
      }
    }
  },
  setup() {
    // 从URL获取参数
    const getDataFromUrl = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedData = urlParams.get('data');
        
        if (encodedData) {
          const decodedData = JSON.parse(decodeURIComponent(encodedData));
          return decodedData;
        }
      } catch (error) {
        console.error('解析URL参数失败:', error);
      }
      
      return null;
    };
    
    // 初始化表单数据
    const urlData = getDataFromUrl();
    const formData = reactive(urlData?.formData || {
      loanType: 'mortgage',
      loanAmount: null,
      interestRate: 0,
      loanTerm: 0,
      repaymentMethod: [],
      mortgage: {
        mortgageType: 'fund',
        fundLoanAmount: null,
        commercialLoanAmount: null,
        mortgageTerm: 240,
        fundRate: 2.60,
        commercialRate: 3.0,
        fundRepaymentMethod: 'equal_principal_interest',
        commercialRepaymentMethod: 'equal_principal_interest',
        // 新增字段
        calculationMode: 'loanAmount', // 计算方式: loanAmount(按贷款总额) 或 housePrice(按房屋总价)
        housePrice: null, // 房屋总价(万元)
        downPaymentRatio: 15, // 默认首付比例(%)
        downPaymentAmount: null, // 首付金额(万元)
        totalLoanAmount: null // 贷款总额(万元)
      }
    });

    // 还款方式选项
    const repaymentOptions = ref([
      { label: '等额本息', value: 'equal_principal_interest' },
      { label: '等额本金', value: 'equal_principal' },
      { label: '先息后本', value: 'interest_first' },
      { label: '一次还本付息', value: 'lump_sum' },
    ]);
    
    // 组合贷款当前显示的贷款类型
    const activeLoanType = ref('fund');
    
    // 计算结果
    const calculationResult = reactive(urlData?.calculationResult || {
      totalRepayment: 0,
      totalInterest: 0,
      monthlyPayment: 0,
      schedule: []
    });
    
    // 判断是否可以计算还款计划
    const canCalculateRepayment = computed(() => {
      if (!formData.loanType) {
        return false;
      }

      if (formData.loanType === 'mortgage') {
        // 按揭贷款的验证逻辑
        if (!formData.mortgage.mortgageType) {
          return false;
        }

        const mortgageType = formData.mortgage.mortgageType;
        
        if (mortgageType === 'fund') {
          // 公积金贷款
          return (
            formData.mortgage.fundLoanAmount > 0 &&
            formData.mortgage.fundRate > 0 &&
            formData.mortgage.mortgageTerm > 0 &&
            formData.mortgage.fundRepaymentMethod
          );
        } else if (mortgageType === 'commercial') {
          // 商业贷款
          return (
            formData.mortgage.commercialLoanAmount > 0 &&
            formData.mortgage.commercialRate > 0 &&
            formData.mortgage.mortgageTerm > 0 &&
            formData.mortgage.commercialRepaymentMethod
          );
        } else if (mortgageType === 'mixed') {
          // 组合贷款 - 判断当前显示的是哪种贷款类型
          if (activeLoanType.value === 'fund') {
            return (
              formData.mortgage.fundLoanAmount > 0 &&
              formData.mortgage.fundRate > 0 &&
              formData.mortgage.mortgageTerm > 0 &&
              formData.mortgage.fundRepaymentMethod
            );
          } else {
            return (
              formData.mortgage.commercialLoanAmount > 0 &&
              formData.mortgage.commercialRate > 0 &&
              formData.mortgage.mortgageTerm > 0 &&
              formData.mortgage.commercialRepaymentMethod
            );
          }
        }
        return false;
      } else {
        // 抵押贷款和信用贷款的验证逻辑
        return (
          formData.loanAmount !== null && 
          formData.loanAmount > 0 &&
          formData.interestRate > 0 &&
          formData.loanTerm > 0 &&
          formData.repaymentMethod.length > 0
        );
      }
    });
    
    // 计算参数
    const calculationParams = computed(() => {
      if (formData.loanType === 'mortgage') {
        // 按揭贷款信息
        const mortgageType = formData.mortgage.mortgageType;
        
        if (mortgageType === 'fund') {
          // 公积金贷款
          return {
            loanAmount: formData.mortgage.fundLoanAmount,
            interestRate: formData.mortgage.fundRate,
            loanTerm: formData.mortgage.mortgageTerm,
            repaymentMethod: formData.mortgage.fundRepaymentMethod,
            repaymentMethodLabel: formData.mortgage.fundRepaymentMethod === 'equal_principal_interest' ? '等额本息' : '等额本金'
          };
        } else if (mortgageType === 'commercial') {
          // 商业贷款
          return {
            loanAmount: formData.mortgage.commercialLoanAmount,
            interestRate: formData.mortgage.commercialRate,
            loanTerm: formData.mortgage.mortgageTerm,
            repaymentMethod: formData.mortgage.commercialRepaymentMethod,
            repaymentMethodLabel: formData.mortgage.commercialRepaymentMethod === 'equal_principal_interest' ? '等额本息' : '等额本金'
          };
        } else if (mortgageType === 'mixed') {
          // 组合贷款 - 根据当前显示的贷款类型返回不同参数
          if (activeLoanType.value === 'fund') {
            return {
              loanAmount: formData.mortgage.fundLoanAmount,
              interestRate: formData.mortgage.fundRate,
              loanTerm: formData.mortgage.mortgageTerm,
              repaymentMethod: formData.mortgage.fundRepaymentMethod,
              repaymentMethodLabel: formData.mortgage.fundRepaymentMethod === 'equal_principal_interest' ? '等额本息' : '等额本金'
            };
          } else {
            return {
              loanAmount: formData.mortgage.commercialLoanAmount,
              interestRate: formData.mortgage.commercialRate,
              loanTerm: formData.mortgage.mortgageTerm,
              repaymentMethod: formData.mortgage.commercialRepaymentMethod,
              repaymentMethodLabel: formData.mortgage.commercialRepaymentMethod === 'equal_principal_interest' ? '等额本息' : '等额本金'
            };
          }
        }
        
        // 默认返回空对象
        return {
          loanAmount: 0,
          interestRate: 0,
          loanTerm: 0,
          repaymentMethod: '',
          repaymentMethodLabel: ''
        };
      } else {
        // 抵押贷款和信用贷款的计算参数
        const repaymentMethod = formData.repaymentMethod[0] || '';
        
        // 获取还款方式的中文名称
        let repaymentMethodLabel = '';
        const method = repaymentOptions.value.find(item => item.value === repaymentMethod);
        if (method) {
          repaymentMethodLabel = method.label;
        }
        
        return {
          loanAmount: formData.loanAmount,
          interestRate: formData.interestRate,
          loanTerm: formData.loanTerm,
          repaymentMethod,
          repaymentMethodLabel
        };
      }
    });
    
    // 重置所有字段
    const resetAllFields = () => {
      // 清空所有参数
      formData.loanType = '';
      resetRepaymentFields();
      formData.mortgage = {
        mortgageType: '',
        fundLoanAmount: null,
        commercialLoanAmount: null,
        mortgageTerm: 240,
        fundRate: 2.60,
        commercialRate: 3.0,
        fundRepaymentMethod: 'equal_principal_interest',
        commercialRepaymentMethod: 'equal_principal_interest',
        // 新增字段
        calculationMode: 'loanAmount', // 计算方式: loanAmount(按贷款总额) 或 housePrice(按房屋总价)
        housePrice: null, // 房屋总价(万元)
        downPaymentRatio: 15, // 默认首付比例(%)
        downPaymentAmount: null, // 首付金额(万元)
        totalLoanAmount: null // 贷款总额(万元)
      };
      
      // 清空结果
      calculationResult.totalRepayment = 0;
      calculationResult.totalInterest = 0;
      calculationResult.monthlyPayment = 0;
      calculationResult.schedule = [];
      
      // 提示用户
      ElMessage.success('已重置所有计算项');
    };
    
    // 贷款方式变更处理
    const handleLoanTypeChange = (value) => {
      // 记录之前的贷款总额，以便在切换贷款方式时保持同步
      const previousLoanAmount = formData.loanType === 'mortgage' 
        ? formData.mortgage.totalLoanAmount 
        : formData.loanAmount;
      
      // 重置表单
      resetRepaymentFields();
      
      // 根据贷款方式设置默认值
      switch(value) {
        case 'mortgage':
          // 按揭贷款初始化
          formData.mortgage = {
            mortgageType: '',
            fundLoanAmount: null,
            commercialLoanAmount: null,
            mortgageTerm: 240, // 单值按揭期限
            fundRate: 2.60, // 单值公积金利率
            commercialRate: 3.0, // 单值商业贷款利率
            fundRepaymentMethod: 'equal_principal_interest',
            commercialRepaymentMethod: 'equal_principal_interest',
            // 新增字段
            calculationMode: 'loanAmount', // 计算方式: loanAmount(按贷款总额) 或 housePrice(按房屋总价)
            housePrice: null, // 房屋总价(万元)
            downPaymentRatio: 15, // 默认首付比例(%)
            downPaymentAmount: null, // 首付金额(万元)
            totalLoanAmount: previousLoanAmount // 同步之前的贷款金额
          };
          break;
        case 'secured':
          // 抵押贷款初始化
          formData.secured = {};
          // 设置抵押贷款默认值
          formData.loanAmount = previousLoanAmount; // 同步之前的贷款金额
          formData.interestRate = 3.0;
          formData.loanTerm = 60; // 默认5年
          formData.repaymentMethod = ['equal_principal_interest'];
          
          // 设置还款方式选项
          repaymentOptions.value = [
            { label: '等额本息', value: 'equal_principal_interest' },
            { label: '等额本金', value: 'equal_principal' },
            { label: '先息后本', value: 'interest_first' }
          ];
          break;
        case 'credit':
          // 信用贷款初始化
          formData.credit = {};
          // 设置信用贷款默认值
          formData.loanAmount = previousLoanAmount; // 同步之前的贷款金额
          formData.interestRate = 3.0;
          formData.loanTerm = 12; // 默认1年
          formData.repaymentMethod = ['equal_principal_interest'];
          
          // 设置还款方式选项
          repaymentOptions.value = [
            { label: '等额本息', value: 'equal_principal_interest' },
            { label: '先息后本', value: 'interest_first' },            
            { label: '一次还本付息', value: 'lump_sum' },
          ];
          break;
      }
    };
    
    // 处理按揭贷款方式变更 - 修改为无论当前贷款类型如何都能响应
    const handleMortgageTypeChange = (value) => {
      // 如果当前不是按揭贷款类型，则切换到按揭贷款类型
      if (formData.loanType !== 'mortgage') {
        formData.loanType = 'mortgage';
        handleLoanTypeChange('mortgage');
      }
      
      // 记录之前的贷款总额，以便在切换按揭贷款类型时保持同步
      const previousTotalLoanAmount = formData.mortgage.totalLoanAmount;
      
      // 根据贷款方式设置默认值
      switch(value) {
        case 'fund':
          // 设置公积金贷款的默认值
          formData.mortgage.fundRate = 2.60;
          formData.mortgage.fundRepaymentMethod = 'equal_principal_interest';
          formData.mortgage.mortgageTerm = 240; // 20年
          // 初始化计算方式
          if (!formData.mortgage.calculationMode) {
            formData.mortgage.calculationMode = 'loanAmount';
          }
          // 根据计算模式设置默认贷款金额
          if (formData.mortgage.calculationMode === 'housePrice') {
            formData.mortgage.fundLoanAmount = 0;
          } else {
            // 同步之前的贷款总额
            formData.mortgage.fundLoanAmount = previousTotalLoanAmount;
          }
          // 更新总贷款金额
          formData.mortgage.totalLoanAmount = formData.mortgage.fundLoanAmount;
          break;
        case 'commercial':
          // 设置商业贷款的默认值
          formData.mortgage.commercialRate = 3.0;
          formData.mortgage.commercialRepaymentMethod = 'equal_principal_interest';
          formData.mortgage.mortgageTerm = 240; // 20年
          // 初始化计算方式
          if (!formData.mortgage.calculationMode) {
            formData.mortgage.calculationMode = 'loanAmount';
          }
          // 根据计算模式设置默认贷款金额
          if (formData.mortgage.calculationMode === 'housePrice') {
            formData.mortgage.commercialLoanAmount = 0;
          } else {
            // 同步之前的贷款总额
            formData.mortgage.commercialLoanAmount = previousTotalLoanAmount;
          }
          // 更新总贷款金额
          formData.mortgage.totalLoanAmount = formData.mortgage.commercialLoanAmount;
          break;
        case 'mixed':
          // 混合贷款默认值
          formData.mortgage.fundRate = 2.60;
          formData.mortgage.commercialRate = 3.0;
          formData.mortgage.fundRepaymentMethod = 'equal_principal_interest';
          formData.mortgage.commercialRepaymentMethod = 'equal_principal_interest';
          formData.mortgage.mortgageTerm = 240; // 20年
          // 初始化计算方式
          if (!formData.mortgage.calculationMode) {
            formData.mortgage.calculationMode = 'loanAmount';
          }
          // 根据计算模式设置默认贷款金额
          if (formData.mortgage.calculationMode === 'housePrice') {
            formData.mortgage.fundLoanAmount = 0;
            formData.mortgage.commercialLoanAmount = 0;
            formData.mortgage.totalLoanAmount = 0;
          } else {
            // 同步之前的贷款总额，并平均分配
            formData.mortgage.totalLoanAmount = previousTotalLoanAmount;
            if (previousTotalLoanAmount !== null) {
              const halfAmount = previousTotalLoanAmount / 2;
              formData.mortgage.fundLoanAmount = halfAmount;
              formData.mortgage.commercialLoanAmount = halfAmount;
            } else {
              formData.mortgage.fundLoanAmount = null;
              formData.mortgage.commercialLoanAmount = null;
            }
          }
          // 默认显示公积金贷款
          activeLoanType.value = 'fund';
          break;
      }
      
      // 触发还款计划计算
      calculateRepaymentSchedule();
    };
    
    // 重置还款相关字段
    const resetRepaymentFields = () => {
      // 重置通用字段
      formData.loanAmount = null;
      formData.interestRate = 0;
      formData.loanTerm = 0;
      formData.repaymentMethod = [];
      
      // 重置计算结果
      calculationResult.totalRepayment = 0;
      calculationResult.totalInterest = 0;
      calculationResult.monthlyPayment = 0;
      calculationResult.schedule = [];
    };
    
    // 格式化货币
    const formatCurrency = (value) => {
      const num = parseFloat(value);
      if (isNaN(num)) return '0.00';
      return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    
    // 计算还款计划表
    const calculateRepaymentSchedule = () => {
      if (!canCalculateRepayment.value) {
        return;
      }
      
      const { loanAmount, interestRate, loanTerm, repaymentMethod } = calculationParams.value;
      
      // 防止loanAmount为null的情况
      if (loanAmount === null || loanAmount === undefined) {
        return;
      }
      
      const loanAmountValue = loanAmount * 10000; // 转换为元
      const monthlyInterestRate = interestRate / 100 / 12; // 月利率
      
      let totalRepayment = 0;
      let totalInterest = 0;
      let monthlyPayment = 0;
      let schedule = [];
      
      // 获取当前日期作为首次还款日期的基准
      const today = new Date();
      const firstPaymentDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      
      // 根据不同还款方式计算
      switch (repaymentMethod) {
        case 'equal_principal_interest': // 等额本息
          // 月供 = 本金 × 月利率 × (1+月利率)^还款月数 / [(1+月利率)^还款月数 - 1]
          monthlyPayment = loanAmountValue * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTerm) / (Math.pow(1 + monthlyInterestRate, loanTerm) - 1);
          totalRepayment = monthlyPayment * loanTerm;
          totalInterest = totalRepayment - loanAmountValue;
          
          // 生成还款计划表
          let remainingPrincipal1 = loanAmountValue;
          for (let i = 1; i <= loanTerm; i++) {
            const paymentDate = new Date(firstPaymentDate);
            paymentDate.setMonth(firstPaymentDate.getMonth() + i - 1);
            
            const interest = remainingPrincipal1 * monthlyInterestRate;
            const principal = monthlyPayment - interest;
            remainingPrincipal1 -= principal;
            
            schedule.push({
              period: i,
              paymentDate: paymentDate.toISOString().split('T')[0],
              monthlyPayment: monthlyPayment.toFixed(2),
              principal: principal.toFixed(2),
              interest: interest.toFixed(2),
              remainingPrincipal: Math.max(0, remainingPrincipal1).toFixed(2)
            });
          }
          break;
          
        case 'equal_principal': // 等额本金
          const monthlyPrincipal = loanAmountValue / loanTerm;
          totalRepayment = 0;
          totalInterest = 0; // 初始化总利息
          
          // 生成还款计划表
          let remainingPrincipal2 = loanAmountValue;
          for (let i = 1; i <= loanTerm; i++) {
            const paymentDate = new Date(firstPaymentDate);
            paymentDate.setMonth(firstPaymentDate.getMonth() + i - 1);
            
            const interest = remainingPrincipal2 * monthlyInterestRate;
            const payment = monthlyPrincipal + interest;
            remainingPrincipal2 -= monthlyPrincipal;
            
            totalRepayment += payment;
            totalInterest += interest; // 累加每月利息
            
            schedule.push({
              period: i,
              paymentDate: paymentDate.toISOString().split('T')[0],
              monthlyPayment: payment.toFixed(2),
              principal: monthlyPrincipal.toFixed(2),
              interest: interest.toFixed(2),
              remainingPrincipal: Math.max(0, remainingPrincipal2).toFixed(2)
            });
          }
          break;
          
        case 'interest_first': // 先息后本
          const monthlyInterest = loanAmountValue * monthlyInterestRate;
          totalInterest = monthlyInterest * loanTerm;
          totalRepayment = loanAmountValue + totalInterest;
          
          // 生成还款计划表
          for (let i = 1; i <= loanTerm; i++) {
            const paymentDate = new Date(firstPaymentDate);
            paymentDate.setMonth(firstPaymentDate.getMonth() + i - 1);
            
            const principal = i === loanTerm ? loanAmountValue : 0;
            const payment = i === loanTerm ? (loanAmountValue + monthlyInterest) : monthlyInterest;
            
            schedule.push({
              period: i,
              paymentDate: paymentDate.toISOString().split('T')[0],
              monthlyPayment: payment.toFixed(2),
              principal: principal.toFixed(2),
              interest: monthlyInterest.toFixed(2),
              remainingPrincipal: i === loanTerm ? '0.00' : loanAmountValue.toFixed(2)
            });
          }
          break;
          
        case 'lump_sum': // 一次还本付息
          const totalInterestAmount = loanAmountValue * monthlyInterestRate * loanTerm;
          totalInterest = totalInterestAmount;
          totalRepayment = loanAmountValue + totalInterest;
          
          // 生成还款计划表
          const paymentDate = new Date(firstPaymentDate);
          paymentDate.setMonth(firstPaymentDate.getMonth() + loanTerm - 1);
          
          schedule.push({
            period: 1,
            paymentDate: paymentDate.toISOString().split('T')[0],
            monthlyPayment: totalRepayment.toFixed(2),
            principal: loanAmountValue.toFixed(2),
            interest: totalInterest.toFixed(2),
            remainingPrincipal: '0.00'
          });
          break;
      }
      
      // 更新计算结果
      calculationResult.totalRepayment = totalRepayment;
      calculationResult.totalInterest = totalInterest;
      calculationResult.monthlyPayment = monthlyPayment;
      calculationResult.schedule = schedule;
    };
    
    // 关闭窗口
    const closeWindow = () => {
      window.close();
    };

    // 输入框聚焦时选中内容
    const handleInputFocus = (event) => {
      if (event && event.target) {
        setTimeout(() => {
          // 检查元素是否支持select方法
          if (event.target.select && typeof event.target.select === 'function') {
            event.target.select();
          }
        }, 0);
      }
    };
    
    // 切换还款方式
    const toggleRepaymentMethod = (value) => {
      const index = formData.repaymentMethod.indexOf(value);
      if (index > -1) {
        formData.repaymentMethod.splice(index, 1);
      } else {
        // 清空之前的选择
        formData.repaymentMethod = [];
        // 添加新的选择
        formData.repaymentMethod.push(value);
      }
    };
    
    // 获取当前按揭贷款的还款方式
    const getCurrentRepaymentMethod = () => {
      if (formData.mortgage.mortgageType === 'fund' || (formData.mortgage.mortgageType === 'mixed' && activeLoanType.value === 'fund')) {
        return formData.mortgage.fundRepaymentMethod;
      } else if (formData.mortgage.mortgageType === 'commercial' || (formData.mortgage.mortgageType === 'mixed' && activeLoanType.value === 'commercial')) {
        return formData.mortgage.commercialRepaymentMethod;
      }
      return 'equal_principal_interest'; // 默认
    };
    
    // 设置当前按揭贷款的还款方式
    const setCurrentRepaymentMethod = (method) => {
      if (formData.mortgage.mortgageType === 'fund' || (formData.mortgage.mortgageType === 'mixed' && activeLoanType.value === 'fund')) {
        formData.mortgage.fundRepaymentMethod = method;
      } else if (formData.mortgage.mortgageType === 'commercial' || (formData.mortgage.mortgageType === 'mixed' && activeLoanType.value === 'commercial')) {
        formData.mortgage.commercialRepaymentMethod = method;
      }
      // 重新计算还款计划
      calculateRepaymentSchedule();
    };
    
    // 期限编辑状态
    const editingTerm = reactive({
      type: '', // 'mortgage' 或 'common'
      value: 0,
      editing: false,
      processing: false // 添加处理标志,防止重复处理
    });
    
    // 处理贷款期限点击事件
    const handleTermClick = (type) => {
      // 如果已经在处理中，则不再触发
      if (editingTerm.processing) {
        return;
      }
      
      // 设置编辑状态
      editingTerm.type = type;
      editingTerm.value = type === 'mortgage' 
        ? formData.mortgage.mortgageTerm 
        : formData.loanTerm;
      editingTerm.editing = true;
      
      // 使用nextTick确保DOM已更新后再聚焦和选中文本
      nextTick(() => {
        const inputElement = document.querySelector('.term-input');
        if (inputElement) {
          // 添加备用方案，以防v-focus指令不生效
          setTimeout(() => {
            inputElement.focus();
            inputElement.select();
          }, 50);
        } else {
          console.error('未找到输入框元素!');
        }
      });
    };
    
    // 处理期限编辑完成
    const handleTermEdit = (event) => {
      // 如果已经在处理中，则不再触发
      if (editingTerm.processing) {
        return;
      }
      
      // 设置处理标志
      editingTerm.processing = true;
      
      let newValue = parseInt(event.target.value);
      
      if (isNaN(newValue) || newValue <= 0) {
        ElMessage({
          message: '请输入有效的数字',
          type: 'warning',
          showClose: true,
          duration: 2000
        });
        newValue = editingTerm.value; // 恢复原值
      } else {
        // 根据贷款类型设置不同的限制
        if (editingTerm.type === 'mortgage') {
          // 按揭贷款期限限制
          if (newValue < 12) {
            ElMessage({
              message: '按揭贷款期限不能小于12个月',
              type: 'warning',
              showClose: true,
              duration: 2000
            });
            newValue = Math.max(12, newValue);
          } else if (newValue > 360) {
            ElMessage({
              message: '按揭贷款期限不能超过360个月',
              type: 'warning',
              showClose: true,
              duration: 2000
            });
            newValue = 360;
          }
          formData.mortgage.mortgageTerm = newValue;
        } else {
          // 抵押贷款和信用贷款期限限制
          const maxTerm = formData.loanType === 'secured' ? 120 : 60;
          if (newValue > maxTerm) {
            ElMessage({
              message: `${formData.loanType === 'secured' ? '抵押' : '信用'}贷款期限不能超过${maxTerm}个月`,
              type: 'warning',
              showClose: true,
              duration: 2000
            });
            newValue = maxTerm;
          }
          formData.loanTerm = newValue;
        }
      }
      
      // 关闭编辑状态
      editingTerm.editing = false;
      
      // 重新计算还款计划
      calculateRepaymentSchedule();
      
      // 延迟重置处理标志,允许下一次操作
      setTimeout(() => {
        editingTerm.processing = false;
      }, 300); // 延长防抖时间，确保不会重复触发
    };
    
    // 处理期限编辑取消
    const handleTermEditCancel = () => {
      editingTerm.editing = false;
      editingTerm.processing = false; // 重置处理标志
    };
    
    // 添加watch监听器，在表单数据变化时自动计算
    watch(
      () => [
        formData.loanType, 
        formData.loanAmount, 
        formData.interestRate, 
        formData.loanTerm, 
        formData.repaymentMethod,
        formData.mortgage.mortgageType,
        formData.mortgage.fundLoanAmount,
        formData.mortgage.commercialLoanAmount,
        formData.mortgage.fundRate,
        formData.mortgage.commercialRate,
        formData.mortgage.mortgageTerm,
        formData.mortgage.fundRepaymentMethod,
        formData.mortgage.commercialRepaymentMethod
      ],
      () => {
        // 使用nextTick确保DOM更新后再计算
        nextTick(() => {
          calculateRepaymentSchedule();
        });
      },
      { deep: true }
    );
    
    onMounted(() => {
      // 页面加载时的初始化操作
      document.title = '贷款计算器';
      // 如果有初始数据则计算还款计划
      calculateRepaymentSchedule();
      
      // 监听窗口变化，确保正确计算
      window.addEventListener('resize', calculateRepaymentSchedule);
    });
    
    onBeforeUnmount(() => {
      // 页面卸载前的清理操作
      window.removeEventListener('resize', calculateRepaymentSchedule);
    });
    
    // 处理计算方式变更
    const handleCalculationModeChange = (mode) => {
      if (mode === 'housePrice') {
        // 切换到按房屋总价模式，初始化相关字段
        if (!formData.mortgage.housePrice) {
          formData.mortgage.housePrice = null; // 默认房屋总价
        }
        if (!formData.mortgage.downPaymentRatio) {
          formData.mortgage.downPaymentRatio = 15; // 默认首付比例
        }
        
        // 计算首付金额和贷款金额
        formData.mortgage.downPaymentAmount = parseFloat((formData.mortgage.housePrice * formData.mortgage.downPaymentRatio / 100).toFixed(2));
        formData.mortgage.totalLoanAmount = parseFloat((formData.mortgage.housePrice - formData.mortgage.downPaymentAmount).toFixed(2));
        
        // 更新相关贷款金额
        updateLoanAmounts();
      } else {
        // 切换到按贷款总额模式，使用当前贷款金额
        if (formData.mortgage.mortgageType === 'fund') {
          // 公积金贷款默认设置为null
          formData.mortgage.fundLoanAmount = null;
          formData.mortgage.totalLoanAmount = null;
        } else if (formData.mortgage.mortgageType === 'commercial') {
          // 商业贷款默认设置为null
          formData.mortgage.commercialLoanAmount = null;
          formData.mortgage.totalLoanAmount = null;
        } else if (formData.mortgage.mortgageType === 'mixed') {
          // 组合贷款默认设置为null
          formData.mortgage.fundLoanAmount = null;
          formData.mortgage.commercialLoanAmount = null;
          formData.mortgage.totalLoanAmount = null;
        }
      }
      
      // 重新计算还款计划
      calculateRepaymentSchedule();
    };
    
    // 处理房屋总价变更
    const handleHousePriceChange = (value) => {
      // 房屋总价变化，首付比例不变，更新首付金额和贷款金额
      if (value === null || value === 0) {
        formData.mortgage.downPaymentAmount = null;
        formData.mortgage.totalLoanAmount = 0;
      } else {
        // 计算首付金额
        formData.mortgage.downPaymentAmount = parseFloat((value * formData.mortgage.downPaymentRatio / 100).toFixed(2));
        // 计算贷款金额 = 房屋总价 - 首付金额
        formData.mortgage.totalLoanAmount = parseFloat((value - formData.mortgage.downPaymentAmount).toFixed(2));
      }
      
      // 更新相关贷款金额
      updateLoanAmounts();
      
      // 重新计算还款计划
      calculateRepaymentSchedule();
    };
    
    // 处理首付比例变更
    const handleDownPaymentRatioChange = (value) => {
      // 首付比例变化，房屋总价不变，更新首付金额和贷款金额
      if (!formData.mortgage.housePrice || formData.mortgage.housePrice === 0) {
        ElMessage.warning('请先输入房屋总价');
        return;
      }

      // 确保首付比例在合理范围内
      if (value > 100) {
        formData.mortgage.downPaymentRatio = 100;
        value = 100;
      } else if (value < 0) {
        formData.mortgage.downPaymentRatio = 0;
        value = 0;
      }

      // 计算首付金额
      formData.mortgage.downPaymentAmount = parseFloat((formData.mortgage.housePrice * value / 100).toFixed(2));
      // 计算贷款金额 = 房屋总价 - 首付金额
      formData.mortgage.totalLoanAmount = parseFloat((formData.mortgage.housePrice - formData.mortgage.downPaymentAmount).toFixed(2));
      
      // 更新相关贷款金额
      updateLoanAmounts();
      
      // 重新计算还款计划
      calculateRepaymentSchedule();
    };
    
    // 处理首付金额变更
    const handleDownPaymentAmountChange = (value) => {
      // 首付金额变化，房屋总价不变，更新首付比例和贷款金额
      if (!formData.mortgage.housePrice || formData.mortgage.housePrice === 0) {
        ElMessage.warning('请先输入房屋总价');
        return;
      }

      // 确保首付金额不超过房屋总价
      if (value > formData.mortgage.housePrice) {
        formData.mortgage.downPaymentAmount = formData.mortgage.housePrice;
        value = formData.mortgage.housePrice;
      } else if (value < 0) {
        formData.mortgage.downPaymentAmount = 0;
        value = 0;
      }

      // 计算首付比例
      formData.mortgage.downPaymentRatio = parseFloat(((value / formData.mortgage.housePrice) * 100).toFixed(1));
      // 计算贷款金额 = 房屋总价 - 首付金额
      formData.mortgage.totalLoanAmount = parseFloat((formData.mortgage.housePrice - value).toFixed(2));
      
      // 更新相关贷款金额
      updateLoanAmounts();
      
      // 重新计算还款计划
      calculateRepaymentSchedule();
    };
    
    // 处理总贷款金额变更
    const handleTotalLoanAmountChange = (value) => {
      if (formData.mortgage.calculationMode === 'housePrice') {
        // 按房屋总价模式，贷款金额变化，房屋总价不变，更新首付金额和首付比例
        if (!formData.mortgage.housePrice || formData.mortgage.housePrice === 0) {
          ElMessage.warning('请先输入房屋总价');
          return;
        }

        // 确保贷款金额不超过房屋总价
        if (value > formData.mortgage.housePrice) {
          formData.mortgage.totalLoanAmount = formData.mortgage.housePrice;
          value = formData.mortgage.housePrice;
        } else if (value < 0) {
          formData.mortgage.totalLoanAmount = 0;
          value = 0;
        }

        // 计算首付金额 = 房屋总价 - 贷款金额
        formData.mortgage.downPaymentAmount = parseFloat((formData.mortgage.housePrice - value).toFixed(2));
        // 计算首付比例
        formData.mortgage.downPaymentRatio = parseFloat(((formData.mortgage.downPaymentAmount / formData.mortgage.housePrice) * 100).toFixed(1));
        
        // 根据贷款类型分配贷款金额
        if (formData.mortgage.mortgageType === 'fund') {
          // 公积金贷款
          formData.mortgage.fundLoanAmount = Math.min(value, 999);
        } else if (formData.mortgage.mortgageType === 'commercial') {
          // 商业贷款
          formData.mortgage.commercialLoanAmount = Math.min(value, 99999);
        } else if (formData.mortgage.mortgageType === 'mixed') {
          // 组合贷款 - 保持原有分配比例
          const previousTotal = (formData.mortgage.fundLoanAmount || 0) + (formData.mortgage.commercialLoanAmount || 0);
          if (previousTotal > 0) {
            // 如果之前有总额，保持原有比例
            const fundRatio = (formData.mortgage.fundLoanAmount || 0) / previousTotal;
            formData.mortgage.fundLoanAmount = parseFloat((value * fundRatio).toFixed(2));
            formData.mortgage.commercialLoanAmount = parseFloat((value - formData.mortgage.fundLoanAmount).toFixed(2));
          } else {
            // 如果之前没有总额，平均分配
            formData.mortgage.fundLoanAmount = parseFloat((value / 2).toFixed(2));
            formData.mortgage.commercialLoanAmount = parseFloat((value - formData.mortgage.fundLoanAmount).toFixed(2));
          }
        }
      } else {
        // 按贷款总额模式
        if (value < 0) {
          formData.mortgage.totalLoanAmount = 0;
          value = 0;
        }
        
        if (formData.mortgage.mortgageType === 'mixed') {
          // 组合贷款场景 - 新的联动逻辑
          // 调整总贷款金额时，公积金金额保持不变，只调整商业贷款金额
          const currentFundAmount = formData.mortgage.fundLoanAmount || 0;
          const currentCommercialAmount = formData.mortgage.commercialLoanAmount || 0;
          const currentTotal = currentFundAmount + currentCommercialAmount;
          
          if (value > currentTotal) {
            // 总额增加的情况
            // 先增加商业贷款金额，如果商业贷款达到上限，再增加公积金贷款
            const additionalAmount = value - currentTotal;
            let newCommercialAmount = currentCommercialAmount + additionalAmount;
            
            if (newCommercialAmount > 99999) {
              // 如果商业贷款超过上限，则设为上限，剩余部分分配给公积金
              const remainingAmount = newCommercialAmount - 99999;
              newCommercialAmount = 99999;
              
              // 增加公积金贷款金额
              let newFundAmount = currentFundAmount + remainingAmount;
              if (newFundAmount > 999) {
                // 如果公积金贷款也超过上限，则设为上限
                newFundAmount = 999;
                // 更新实际总额
                formData.mortgage.totalLoanAmount = newFundAmount + newCommercialAmount;
              } else {
                formData.mortgage.fundLoanAmount = newFundAmount;
              }
              
              formData.mortgage.commercialLoanAmount = newCommercialAmount;
            } else {
              // 商业贷款未超过上限，只更新商业贷款金额
              formData.mortgage.commercialLoanAmount = newCommercialAmount;
            }
          } else if (value < currentTotal) {
            // 总额减少的情况
            // 先减少商业贷款金额，如果商业贷款为0，再减少公积金贷款
            const reductionAmount = currentTotal - value;
            
            if (reductionAmount <= currentCommercialAmount) {
              // 减少的金额小于等于当前商业贷款金额，只减少商业贷款
              formData.mortgage.commercialLoanAmount = currentCommercialAmount - reductionAmount;
            } else {
              // 减少的金额大于当前商业贷款金额，商业贷款清零，减少公积金贷款
              formData.mortgage.commercialLoanAmount = 0;
              const remainingReduction = reductionAmount - currentCommercialAmount;
              formData.mortgage.fundLoanAmount = Math.max(0, currentFundAmount - remainingReduction);
            }
          }
          // 如果总额不变，不做任何调整
        } else if (formData.mortgage.mortgageType === 'fund') {
          // 公积金贷款
          formData.mortgage.fundLoanAmount = Math.min(value, 999);
          if (value > 999) {
            formData.mortgage.totalLoanAmount = 999;
          }
        } else if (formData.mortgage.mortgageType === 'commercial') {
          // 商业贷款
          formData.mortgage.commercialLoanAmount = Math.min(value, 99999);
          if (value > 99999) {
            formData.mortgage.totalLoanAmount = 99999;
          }
        }
      }
      
      // 重新计算还款计划
      calculateRepaymentSchedule();
    };
    
    // 处理公积金贷款金额变更
    const handleFundLoanAmountChange = (value) => {
      if (formData.mortgage.mortgageType === 'mixed') {
        // 组合贷款场景
        if (formData.mortgage.calculationMode === 'housePrice') {
          // 按房屋总价模式的逻辑保持不变
          if (!formData.mortgage.housePrice || formData.mortgage.housePrice === 0) {
            ElMessage.warning('请先输入房屋总价');
            return;
          }

          // 确保公积金贷款金额不超过房屋总价和最大限额
          if (value > formData.mortgage.housePrice) {
            formData.mortgage.fundLoanAmount = formData.mortgage.housePrice;
            value = formData.mortgage.housePrice;
          } else if (value > 999) {
            formData.mortgage.fundLoanAmount = 999;
            value = 999;
          } else if (value < 0) {
            formData.mortgage.fundLoanAmount = 0;
            value = 0;
          }

          // 计算商业贷款金额 = 总贷款金额 - 公积金贷款金额
          const newCommercialLoanAmount = parseFloat((formData.mortgage.totalLoanAmount - value).toFixed(2));
          formData.mortgage.commercialLoanAmount = Math.max(0, newCommercialLoanAmount);
          
          // 若公积金贷款金额变动导致总贷款金额超过房屋总价，则调整总贷款金额
          const totalLoan = value + formData.mortgage.commercialLoanAmount;
          if (totalLoan > formData.mortgage.housePrice) {
            formData.mortgage.totalLoanAmount = formData.mortgage.housePrice;
            // 重新计算首付
            formData.mortgage.downPaymentAmount = 0;
            formData.mortgage.downPaymentRatio = 0;
          } else {
            formData.mortgage.totalLoanAmount = totalLoan;
            // 重新计算首付
            formData.mortgage.downPaymentAmount = parseFloat((formData.mortgage.housePrice - formData.mortgage.totalLoanAmount).toFixed(2));
            formData.mortgage.downPaymentRatio = parseFloat(((formData.mortgage.downPaymentAmount / formData.mortgage.housePrice) * 100).toFixed(1));
          }
        } else {
          // 按贷款总额模式 - 新的联动逻辑
          // 确保不超过最大限额
          if (value > 999) {
            formData.mortgage.fundLoanAmount = 999;
            value = 999;
          } else if (value < 0) {
            formData.mortgage.fundLoanAmount = 0;
            value = 0;
          }
          
          // 无论总贷款金额是否存在，都更新商业贷款金额和总贷款金额
          // 计算商业贷款金额 = 原商业贷款金额（保持不变）
          // 计算总贷款金额 = 公积金贷款金额 + 商业贷款金额
          formData.mortgage.totalLoanAmount = parseFloat((value + (formData.mortgage.commercialLoanAmount || 0)).toFixed(2));
        }
      } else if (formData.mortgage.mortgageType === 'fund') {
        // 公积金贷款场景
        if (formData.mortgage.calculationMode === 'housePrice') {
          // 按房屋总价模式
          if (!formData.mortgage.housePrice || formData.mortgage.housePrice === 0) {
            ElMessage.warning('请先输入房屋总价');
            return;
          }

          // 确保公积金贷款金额不超过房屋总价和最大限额
          if (value > formData.mortgage.housePrice) {
            formData.mortgage.fundLoanAmount = formData.mortgage.housePrice;
            value = formData.mortgage.housePrice;
          } else if (value > 999) {
            formData.mortgage.fundLoanAmount = 999;
            value = 999;
          } else if (value < 0) {
            formData.mortgage.fundLoanAmount = 0;
            value = 0;
          }

          // 更新总贷款金额
          formData.mortgage.totalLoanAmount = value;
          
          // 计算首付金额和首付比例
          formData.mortgage.downPaymentAmount = parseFloat((formData.mortgage.housePrice - value).toFixed(2));
          formData.mortgage.downPaymentRatio = parseFloat(((formData.mortgage.downPaymentAmount / formData.mortgage.housePrice) * 100).toFixed(1));
        } else {
          // 按贷款总额模式，更新总贷款金额
          // 确保不超过最大限额
          if (value > 999) {
            formData.mortgage.fundLoanAmount = 999;
            value = 999;
          } else if (value < 0) {
            formData.mortgage.fundLoanAmount = 0;
            value = 0;
          }
          formData.mortgage.totalLoanAmount = value;
        }
      }
      
      // 重新计算还款计划
      calculateRepaymentSchedule();
    };
    
    // 处理商业贷款金额变更
    const handleCommercialLoanAmountChange = (value) => {
      if (formData.mortgage.mortgageType === 'mixed') {
        // 组合贷款场景
        if (formData.mortgage.calculationMode === 'housePrice') {
          // 按房屋总价模式的逻辑保持不变
          if (!formData.mortgage.housePrice || formData.mortgage.housePrice === 0) {
            ElMessage.warning('请先输入房屋总价');
            return;
          }

          // 确保商业贷款金额不超过房屋总价和最大限额
          if (value > formData.mortgage.housePrice) {
            formData.mortgage.commercialLoanAmount = formData.mortgage.housePrice;
            value = formData.mortgage.housePrice;
          } else if (value > 99999) {
            formData.mortgage.commercialLoanAmount = 99999;
            value = 99999;
          } else if (value < 0) {
            formData.mortgage.commercialLoanAmount = 0;
            value = 0;
          }

          // 计算公积金贷款金额 = 总贷款金额 - 商业贷款金额
          const newFundLoanAmount = parseFloat((formData.mortgage.totalLoanAmount - value).toFixed(2));
          formData.mortgage.fundLoanAmount = Math.max(0, Math.min(999, newFundLoanAmount));
          
          // 若商业贷款金额变动导致总贷款金额超过房屋总价，则调整总贷款金额
          const totalLoan = value + formData.mortgage.fundLoanAmount;
          if (totalLoan > formData.mortgage.housePrice) {
            formData.mortgage.totalLoanAmount = formData.mortgage.housePrice;
            // 重新计算首付
            formData.mortgage.downPaymentAmount = 0;
            formData.mortgage.downPaymentRatio = 0;
          } else {
            formData.mortgage.totalLoanAmount = totalLoan;
            // 重新计算首付
            formData.mortgage.downPaymentAmount = parseFloat((formData.mortgage.housePrice - formData.mortgage.totalLoanAmount).toFixed(2));
            formData.mortgage.downPaymentRatio = parseFloat(((formData.mortgage.downPaymentAmount / formData.mortgage.housePrice) * 100).toFixed(1));
          }
        } else {
          // 按贷款总额模式 - 新的联动逻辑
          // 确保不超过最大限额
          if (value > 99999) {
            formData.mortgage.commercialLoanAmount = 99999;
            value = 99999;
          } else if (value < 0) {
            formData.mortgage.commercialLoanAmount = 0;
            value = 0;
          }
          
          // 无论总贷款金额是否存在，都更新公积金贷款金额和总贷款金额
          // 计算总贷款金额 = 公积金贷款金额 + 商业贷款金额
          formData.mortgage.totalLoanAmount = parseFloat(((formData.mortgage.fundLoanAmount || 0) + value).toFixed(2));
        }
      } else if (formData.mortgage.mortgageType === 'commercial') {
        // 商业贷款场景
        if (formData.mortgage.calculationMode === 'housePrice') {
          // 按房屋总价模式
          if (!formData.mortgage.housePrice || formData.mortgage.housePrice === 0) {
            ElMessage.warning('请先输入房屋总价');
            return;
          }

          // 确保商业贷款金额不超过房屋总价和最大限额
          if (value > formData.mortgage.housePrice) {
            formData.mortgage.commercialLoanAmount = formData.mortgage.housePrice;
            value = formData.mortgage.housePrice;
          } else if (value > 99999) {
            formData.mortgage.commercialLoanAmount = 99999;
            value = 99999;
          } else if (value < 0) {
            formData.mortgage.commercialLoanAmount = 0;
            value = 0;
          }

          // 更新总贷款金额
          formData.mortgage.totalLoanAmount = value;
          
          // 计算首付金额和首付比例
          formData.mortgage.downPaymentAmount = parseFloat((formData.mortgage.housePrice - value).toFixed(2));
          formData.mortgage.downPaymentRatio = parseFloat(((formData.mortgage.downPaymentAmount / formData.mortgage.housePrice) * 100).toFixed(1));
        } else {
          // 按贷款总额模式，更新总贷款金额
          // 确保不超过最大限额
          if (value > 99999) {
            formData.mortgage.commercialLoanAmount = 99999;
            value = 99999;
          } else if (value < 0) {
            formData.mortgage.commercialLoanAmount = 0;
            value = 0;
          }
          formData.mortgage.totalLoanAmount = value;
        }
      }
      
      // 重新计算还款计划
      calculateRepaymentSchedule();
    };
    
    // 更新贷款金额
    const updateLoanAmounts = () => {
      if (formData.mortgage.calculationMode === 'housePrice') {
        // 按房屋总价模式，贷款金额默认为0
        if (formData.mortgage.mortgageType === 'fund') {
          // 公积金贷款
          formData.mortgage.fundLoanAmount = formData.mortgage.totalLoanAmount || 0;
        } else if (formData.mortgage.mortgageType === 'commercial') {
          // 商业贷款
          formData.mortgage.commercialLoanAmount = formData.mortgage.totalLoanAmount || 0;
        } else if (formData.mortgage.mortgageType === 'mixed') {
          // 组合贷款，默认保持公积金贷款金额不变，调整商业贷款金额
          if (!formData.mortgage.fundLoanAmount && !formData.mortgage.commercialLoanAmount) {
            // 如果两个贷款金额都为空，则平均分配
            const halfAmount = formData.mortgage.totalLoanAmount ? formData.mortgage.totalLoanAmount / 2 : 0;
            formData.mortgage.fundLoanAmount = halfAmount;
            formData.mortgage.commercialLoanAmount = halfAmount;
          } else if (formData.mortgage.fundLoanAmount > formData.mortgage.totalLoanAmount) {
            // 如果公积金贷款金额大于总贷款金额，调整公积金贷款金额
            formData.mortgage.fundLoanAmount = formData.mortgage.totalLoanAmount || 0;
            formData.mortgage.commercialLoanAmount = 0;
          } else {
            // 否则调整商业贷款金额
            formData.mortgage.commercialLoanAmount = parseFloat(((formData.mortgage.totalLoanAmount || 0) - (formData.mortgage.fundLoanAmount || 0)).toFixed(2));
          }
        }
      } else {
        // 按贷款总额模式，贷款金额可以为null
        if (formData.mortgage.mortgageType === 'fund') {
          // 公积金贷款，totalLoanAmount跟随fundLoanAmount
          formData.mortgage.totalLoanAmount = formData.mortgage.fundLoanAmount;
        } else if (formData.mortgage.mortgageType === 'commercial') {
          // 商业贷款，totalLoanAmount跟随commercialLoanAmount
          formData.mortgage.totalLoanAmount = formData.mortgage.commercialLoanAmount;
        } else if (formData.mortgage.mortgageType === 'mixed') {
          // 组合贷款，计算totalLoanAmount
          if (formData.mortgage.fundLoanAmount === null && formData.mortgage.commercialLoanAmount === null) {
            formData.mortgage.totalLoanAmount = null;
          } else {
            const fundAmount = formData.mortgage.fundLoanAmount || 0;
            const commercialAmount = formData.mortgage.commercialLoanAmount || 0;
            formData.mortgage.totalLoanAmount = parseFloat((fundAmount + commercialAmount).toFixed(2));
          }
        }
      }
    };
    
    return {
      formData,
      calculationResult,
      calculationParams,
      canCalculateRepayment,
      repaymentOptions,
      activeLoanType,
      handleLoanTypeChange,
      handleMortgageTypeChange,
      calculateRepaymentSchedule,
      formatCurrency,
      closeWindow,
      handleInputFocus,
      resetAllFields,
      toggleRepaymentMethod,
      getCurrentRepaymentMethod,
      setCurrentRepaymentMethod,
      // 贷款期限编辑相关
      editingTerm,
      handleTermClick,
      handleTermEdit,
      handleTermEditCancel,
      // 新增方法
      handleCalculationModeChange,
      handleHousePriceChange,
      handleDownPaymentRatioChange,
      handleDownPaymentAmountChange,
      handleTotalLoanAmountChange,
      handleFundLoanAmountChange,
      handleCommercialLoanAmountChange
    };
  }
}
</script>

<style lang="scss" scoped>
/* ========== 1. 页面布局基础样式 ========== */
.LoanCalculator {
  width: 100%;
  height: 100%;
  padding: 20px;
  background-color: #f5f7fa;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
}

/* 蓝色头部标题栏 */
.calculator-header {
  width: 100%;
  max-width: 1000px;
  height: 55px;
  padding: 0 20px;
  background-color: #1b68de;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  margin-bottom: 0;
  box-sizing: border-box;
  
  .calculator-title {
    margin: 0;
    font-size: 22px;
    font-weight: 500;
    letter-spacing: 1px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .close-btn {
    color: white;
    font-size: 20px;
    
    &:hover {
      color: #f0f0f0;
    }
  }
}

.form-container {
  width: 100%;
  max-width: 1000px;
  background: white;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  box-sizing: border-box;
  overflow: hidden;
  height: calc(100% - 55px);
}

/* ========== 2. 面板通用样式 ========== */
/* 左侧输入面板 */
.input-panel {
  width: 40%;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid #dcdfe6;
}

/* 右侧内容面板 */
.content-panel {
  width: 60%; 
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.reference-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  overflow: hidden;
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
  justify-content: space-between;
}

.panel-title {
  padding: 0;
  color: #000000;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ========== 4. 面板内容样式 ========== */
.panel-content {
  padding: 16px 16px 0px 16px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #dcdfe6 #f5f7fa;
  flex: 1;
  background-color: #ffffff;
  min-height: 0; /* 确保可以滚动 */
}

/* 自定义面板滚动条样式 */
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

.panel-content::-webkit-scrollbar-thumb:hover {
  background-color: #c0c4cc;
}

/* ========== 5. 贷款信息表单样式 ========== */

/* 卡片样式 */
.form-card {
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  padding: 0;
  margin-bottom: 16px;
  overflow: hidden;
  border: 1px solid #ebeef5;
}

.card-title {
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 500;
  color: #1b68de;
  background-color: #ecf5ff;
  border-bottom-color: #d9ecff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mixed-title {
  color: #1b68de;
  background-color: #ecf5ff;
  border-bottom-color: #d9ecff;
}

.commercial-title {
  color: #67c23a;
  background-color: #f0f9eb;
  border-bottom-color: #e1f3d8;
}

.fund-title {
  color: #e6a23c;
  background-color: #fdf6ec;
  border-bottom-color: #faecd8;
}

/* 贷款方式选择器 */
.loan-selector {
  display: flex;
  justify-content: space-between;
  padding: 20px;
  gap: 15px;
}

.loan-type-item {
  flex: 1;
  height: 90px;
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  gap: 10px;
  
  &:hover {
    border-color: #1b68de;
    background: #f5f9ff;
    box-shadow: 0 4px 12px rgba(27, 104, 222, 0.1);
  }
  
  &.active {
    background: #ecf5ff;
    border-color: #1b68de;
    box-shadow: 0 4px 12px rgba(27, 104, 222, 0.2);
    
    span {
      color: #1b68de;
      font-weight: 500;
    }
  }
  
  .icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ecf5ff;
    color: #1b68de;
    font-size: 20px;
    
    &.mortgage-icon {
      background: #ecf5ff;
      color: #1b68de;
    }
    
    &.secured-icon {
      background: #ecf5ff;
      color: #1b68de;
    }
    
    &.credit-icon {
      background: #ecf5ff;
      color: #1b68de;
    }
  }
  
  span {
    font-size: 14px;
    color: #606266;
  }
}

/* 按揭贷款类型选择卡片 - 现代视觉层次设计 */
.mortgage-subtype-card {
  padding: 15px 20px;
  background-color: #ebeef590;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 60px; /* 箭头位置，使其指向按揭贷款卡片 */
    width: 10px;
    height: 10px;
    background-color: #fff;
    transform: rotate(-45deg);
    z-index: 1;
  }
}

.mortgage-type-selector {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.mortgage-type-item {
  flex: 1;
  height: 35px;
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  color: #606266;
  
  &:hover {
    border-color: #1b68de;
    background: #f5f9ff;
    box-shadow: 0 2px 8px rgba(27, 104, 222, 0.1);
  }
  
  &.active {
    background: #ecf5ff;
    border-color: #1b68de;
    color: #1b68de;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(27, 104, 222, 0.2);
  }
}

/* 参数字段网格 */
.param-fields-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px 20px;
  padding: 20px;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  &.full-width {
    grid-column: span 2;
  }
}

.field-label {
  font-size: 14px;
  color: #606266;
  font-weight: normal;
}

.field-input {
  width: 100%;
}

/* 还款方式按钮组 */
.repayment-buttons {
  display: flex;
  gap: 10px;
}

.repayment-button {
  flex: 1;
  height: 38px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  color: #606266;
  
  &:hover {
    border-color: #1b68de;
  }
  
  &.active {
    background: #ecf5ff;
    border-color: #1b68de;
    color: #1b68de;
    font-weight: 500;
  }
}

/* 贷款期限滑块 */
.loan-term-slider {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 15px 15px;
}

.term-value {
  font-size: 16px;
  color: #303133;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  cursor: text;
  position: relative;
  height: 30px; // 固定高度，避免输入状态高度变化
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  .term-input {
    width: 100%;
    font-size: 20px;
    color: #303133;
    font-weight: 600;
    text-align: center;
    border: none;
    outline: none;
    height: 100%;
  }
}

:deep(.term-slider .el-slider__runway) {
  margin: 15px 0;
}

:deep(.term-slider .el-slider__button) {
  width: 18px;
  height: 18px;
  border: 2px solid #1b68de;
}

:deep(.term-slider .el-slider__bar) {
  background-color: #1b68de;
}

:deep(.term-slider .el-slider__marks-text) {
  font-size: 12px;
  color: #909399;
}

/* 还款方式选择器 */
.repayment-method-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.repayment-method-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  border-radius: 6px;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background: #f0f2f5;
  }
  
  &.active {
    background: #ecf5ff;
  }
  
  .method-checkbox {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    border: 1px solid #dcdfe6;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    
    .checkbox-inner {
      width: 10px;
      height: 10px;
      border-radius: 2px;
      background: #1b68de;
    }
  }
  
  span {
    font-size: 14px;
    color: #606266;
  }
}

/* 表单控件样式定制 */
:deep(.custom-input-number) {
  width: 100%;
}

:deep(.custom-input-number .el-input__inner) {
  text-align: left;
  font-weight: 600;
  color: #303133;
  font-size: 16px;
  height: 38px;
}

:deep(.custom-input-number .el-input-number__decrease),
:deep(.custom-input-number .el-input-number__increase) {
  background-color: #f5f7fa;
  border-color: #dcdfe6;
  height: 19px;
  line-height: 19px;
  margin: 0;
  border-radius: 0;
}

:deep(.custom-input-number .el-input-number__increase) {
  border-bottom: 1px solid #dcdfe6;
  border-top-right-radius: 3px;
}

:deep(.custom-input-number .el-input-number__decrease) {
  bottom: 1px;
  top: auto;
  border-bottom-right-radius: 3px;
}

:deep(.custom-input-number .el-input-number__increase:hover),
:deep(.custom-input-number .el-input-number__decrease:hover) {
  color: #1b68de;
  background-color: #ecf5ff;
}
/* ========== 6. 还款计划表样式 ========== */
.repayment-calculator {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  flex-shrink: 0;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.3s ease-out, transform 0.3s ease-out;
  
  &.show {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 贷款概览卡片 */
.loan-summary-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.02);
  overflow: hidden;
  transition: box-shadow 0.3s;
  flex-shrink: 0; /* 防止卡片被压缩 */
}

.loan-info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
}

.loan-info-item {
  padding: 10px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  // font-family: 'DIN Alternate', 'Arial', sans-serif;
}

.loan-info-item:last-child {
  border-right: none;
}


.info-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: flex-end;
}

.info-value.method {
  font-size: 16px;
}

.info-unit {
  font-size: 13px;
  color: #606266;
  font-weight: 400;
  margin-left: 4px;
}

/* 还款概览卡片 */
.repayment-summary-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.02);
  overflow: hidden;
  transition: box-shadow 0.3s;
  flex-shrink: 0; /* 防止卡片被压缩 */
}

.card-title {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  height: 50px;
  box-sizing: border-box;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.summary-tip {
  font-size: 12px;
  font-weight: normal;
  opacity: 0.8;
}

.summary-card-content {
  display: flex;
  padding: 0;
}

.summary-item {
  flex: 1;
  padding: 16px 0px;
  text-align: center;
  transition: background-color 0.3s;
  position: relative;
}

.summary-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 20%;
  height: 60%;
  width: 1px;
  background-color: rgba(0, 0, 0, 0.05);
}

.summary-item:hover {
  background-color: rgba(27, 104, 222, 0.03);
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1b68de;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  font-family: 'DIN Alternate', 'Arial', sans-serif;
}

.summary-unit {
  font-size: 16px;
  font-weight: 400;
  margin-left: 4px;
}

.summary-label {
  font-size: 14px;
  color: #606266;
}

.total-repayment .summary-value {
  color: #1b68de;
}

.total-interest .summary-value {
  color: #f56c6c;
}

.monthly-payment .summary-value {
  color: #67c23a;
}

/* 还款计划表卡片 */
.repayment-schedule-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.02);
  overflow: hidden;
  transition: box-shadow 0.3s;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 300px;
  margin-bottom: 16px;
  flex-shrink: 0; /* 防止卡片被压缩 */
}

.schedule-card-content {
  padding: 0;
  position: relative;
  flex: 1;
  min-height: 0; /* 关键：确保flex子元素可以正确滚动 */
  display: flex;
  flex-direction: column;
  // font-family: 'DIN Alternate', 'Arial', sans-serif;
}

.schedule-table-wrapper {
  flex: 1;
  overflow: auto;
  min-height: 0; /* 关键：确保可以滚动 */
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.schedule-table thead {
  position: sticky;
  top: 0;
  z-index: 2;
  background: white;
}

.schedule-table thead::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.05);
}

.schedule-table th,
.schedule-table td {
  padding: 14px 10px;
  text-align: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  white-space: nowrap;
}

.schedule-table th {
  background-color: #fafafa;
  font-weight: 500;
  color: #606266;
}

.schedule-table tr:hover {
  background-color: rgba(27, 104, 222, 0.03);
}

.schedule-table tr.first-year {
  background-color: rgba(27, 104, 222, 0.02);
}

/* 自定义滚动条样式 */
.schedule-table-wrapper::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.schedule-table-wrapper::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.schedule-table-wrapper::-webkit-scrollbar-track {
  background-color: #f5f7fa;
}

.schedule-table-wrapper::-webkit-scrollbar-thumb:hover {
  background-color: #c0c4cc;
}

/* Firefox滚动条样式 */
.schedule-table-wrapper {
  scrollbar-width: thin;
  scrollbar-color: #dcdfe6 #f5f7fa;
}

/* 空白状态样式 */
.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.3s ease-out, transform 0.3s ease-out;
  
  &.show {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-state-content {
  max-width: 500px;
  text-align: center;
  background: white;
  border-radius: 12px;
}

.empty-state-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(27, 104, 222, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: #1b68de;
  font-size: 32px;
}

.empty-state-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.empty-state-desc {
  font-size: 15px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 30px;
}

// .empty-state-steps {
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   gap: 0;
// }

// .step-item {
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   gap: 8px;
// }

// .step-number {
//   width: 32px;
//   height: 32px;
//   border-radius: 50%;
//   background: #1b68de;
//   color: white;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   font-weight: 600;
// }

// .step-text {
//   font-size: 13px;
//   color: #606266;
//   white-space: nowrap;
// }

// .step-connector {
//   width: 60px;
//   height: 2px;
//   background: rgba(27, 104, 222, 0.3);
//   margin: 0 4px;
// }

/* 响应式调整 */
@media (max-width: 992px) {
  .loan-info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .loan-info-item:nth-child(2) {
    border-right: none;
  }
  
  .loan-info-item:nth-child(1),
  .loan-info-item:nth-child(2) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  .summary-card-content {
    flex-direction: column;
  }  
  
  .step-connector {
    width: 2px;
    height: 20px;
    margin: 0;
  }
}

@media (max-width: 768px) {
  .loan-info-grid {
    grid-template-columns: 1fr;
  }
  
  .loan-info-item {
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  .loan-info-item:last-child {
    border-bottom: none;
  }
  
  .schedule-table th,
  .schedule-table td {
    padding: 10px 8px;
    font-size: 12px;
  }
}

/* ========== 贷款信息表单样式 ========== */
.reset-button {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  height: 30px;
  padding: 0 12px;
  border-radius: 4px;
  color: white;
  // background-color: #1b68de;
}

.loan-type-group, 
.loan-subtype-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.loan-params-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 8px;
}

.loan-term-item {
  grid-column: span 2;
}

.repayment-method-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 美化表单控件样式 */
:deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
  font-size: 14px;
  padding-bottom: 6px;
}

:deep(.el-radio) {
  height: 36px;
  margin-right: 0;
  padding: 0 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  margin-bottom: 3px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  
  &.is-checked {
    background-color: #ecf5ff;
    border-color: #409EFF;
    color: #409EFF;
  }
  
  &:hover:not(.is-checked) {
    border-color: #c0c4cc;
  }
}

:deep(.el-checkbox) {
  margin-right: 0;
  padding: 8px 0;
  display: flex;
  align-items: center;
  height: 36px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .loan-params-grid {
    grid-template-columns: 1fr;
  }
  
  .loan-type-selector {
    flex-direction: column;
    gap: 15px;
  }
  
  .mortgage-type-selector {
    flex-direction: column;
    gap: 8px;
  }
  
  .term-value {
    font-size: 14px;
  }
  
  .loan-type-switch {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

:deep(.term-tooltip) {
  font-size: 12px;
}

/* 计算方式选择器 */
.calculation-mode-selector {
  display: flex;
  justify-content: space-between;
  padding: 15px 20px;
  gap: 12px;
}

.calculation-mode-item {
  flex: 1;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  color: #606266;
  
  &:hover {
    border-color: #1b68de;
    background: #f5f9ff;
  }
  
  &.active {
    background: #ecf5ff;
    border-color: #1b68de;
    color: #1b68de;
    font-weight: 500;
  }
}

/* 房屋总价样式 */
.house-price-title {
  color: #fb8e17;
  background-color: #fff8f0;
  border-bottom-color: #ffe5c7;
}

/* 计算方式开关样式 */
.calculation-mode-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.switch-label {
  font-size: 13px;
  color: #606266;
}

/* 分割线样式 */
.divider {
  width: 100%;
  height: 20px;
  display: flex;
  align-items: center;
  // margin: 8px 0;
  position: relative;
  
  &::before {
    content: '';
    height: 1px;
    background-color: #EBEEF5;
    flex: 1;
  }
  
  span {
    padding: 0 12px;
    font-size: 13px;
    color: #909399;
    background-color: #fff;
  }
  
  &::after {
    content: '';
    height: 1px;
    background-color: #EBEEF5;
    flex: 1;
  }
}

/* 添加禁用状态的样式 */
:deep(.custom-input-number.is-disabled .el-input__wrapper) {
  cursor: not-allowed;
  background-color: #f5f7fa;
}

:deep(.custom-input-number.is-disabled .el-input-number__decrease),
:deep(.custom-input-number.is-disabled .el-input-number__increase) {
  cursor: not-allowed;
  background-color: #f5f7fa;
  color: #c0c4cc;
}

/* ========== 8. 其他特定组件样式 ========== */
/* 组合贷款情况下的切换按钮 */
.loan-type-switch {
  display: flex;
  align-items: center;
  gap: 10px;
}

.custom-radio-group {
  display: flex;
  gap: 0;
}

/* 还款方式切换按钮 */
.repayment-method-switch {
  display: flex;
}

.repayment-method-button {
  padding: 5px 8px;
  font-size: 12px;
  border: 1px solid #dcdfe6;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  color: #606266;
  height: 28px;
  line-height: 18px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:first-child {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }

  &:last-child {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    border-left: none;
  }

  &.active {
    background-color: #67c23a;
    border-color: #67c23a;
    color: white;
  }
}

/* 标题组样式 */
.title-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 公积金、商业计算结果切换按钮 */
.custom-radio-button {
  padding: 5px 10px;
  font-size: 12px;
  border: 1px solid #dcdfe6;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  color: #606266;
  height: 28px;
  line-height: 18px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;

  &:first-child {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }

  &:last-child {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    border-left: none;
  }

  &.active {
    background-color: #1b68de;
    border-color: #1b68de;
    color: white;
  }
}
</style> 