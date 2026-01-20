// EXTRACTION DEBUGGING UTILITY
// Add this to AutoUpload.jsx autoExtractMetadata() or use in browser console
// Purpose: Verify PDF extraction is working end-to-end

window.debugExtraction = {
  // Test backend extraction endpoint directly
  async testBackendExtraction(pdfFile) {
    console.log('🧪 [DEBUG] Testing backend extraction...');
    
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    
    try {
      const response = await fetch('/api/past-papers/extract', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      console.log('✅ [DEBUG] Backend response:', data);
      
      if (data.success) {
        console.log('📊 [DEBUG] Extracted data:', {
          unitCode: data.extraction.unitCode,
          unitName: data.extraction.unitName,
          year: data.extraction.year,
          semester: data.extraction.semester,
          examType: data.extraction.examType,
          method: data.extraction.extractionMethod
        });
        
        console.log('📈 [DEBUG] Confidence scores:', data.confidence);
        
        return {
          success: true,
          extraction: data.extraction,
          confidence: data.confidence
        };
      } else {
        console.error('❌ [DEBUG] Extraction failed:', data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('❌ [DEBUG] Fetch error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Verify extractedMetadata state
  verifyExtractedMetadata(extractedMetadata) {
    console.log('🔍 [DEBUG] Checking extractedMetadata...');
    
    if (!extractedMetadata) {
      console.warn('⚠️ [DEBUG] extractedMetadata is null/undefined');
      return false;
    }
    
    if (extractedMetadata.source !== 'backend-extracted') {
      console.warn('⚠️ [DEBUG] source is not backend-extracted:', extractedMetadata.source);
      return false;
    }
    
    const requiredFields = ['unitCode', 'unitName', 'year', 'semester', 'examType'];
    const missingFields = requiredFields.filter(field => !extractedMetadata[field]);
    
    if (missingFields.length > 0) {
      console.warn('⚠️ [DEBUG] Missing fields:', missingFields);
    }
    
    console.log('✅ [DEBUG] extractedMetadata looks good:', extractedMetadata);
    return true;
  },
  
  // Simulate upload with detailed logging
  async simulateUpload(extractedMetadata, file, formData) {
    console.log('🎬 [DEBUG] Simulating upload process...');
    
    // Check extraction state
    if (extractedMetadata && extractedMetadata.source === 'backend-extracted') {
      console.log('✅ [DEBUG] Branch: USING BACKEND-EXTRACTED METADATA');
      console.log('📊 [DEBUG] Will use:', {
        unitCode: extractedMetadata.unitCode,
        unitName: extractedMetadata.unitName,
        year: extractedMetadata.year,
        semester: extractedMetadata.semester,
        examType: extractedMetadata.examType
      });
      return 'backend-extracted';
    } else {
      console.log('⚠️ [DEBUG] Branch: FALLING BACK TO FILENAME PARSING');
      const fileName = file.name.replace('.pdf', '').trim();
      console.log('📋 [DEBUG] Will parse filename:', fileName);
      return 'filename-parsing';
    }
  },
  
  // Check if API endpoint is accessible
  async checkEndpointHealth() {
    console.log('🏥 [DEBUG] Checking API endpoint health...');
    
    try {
      // Try OPTIONS request first
      const response = await fetch('/api/past-papers/extract', {
        method: 'OPTIONS'
      });
      
      if (response.ok) {
        console.log('✅ [DEBUG] Endpoint is accessible (OPTIONS OK)');
        return true;
      } else {
        console.warn('⚠️ [DEBUG] Endpoint returned status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ [DEBUG] Endpoint not accessible:', error.message);
      return false;
    }
  },
  
  // Full diagnostic
  async runFullDiagnostic(pdfFile, extractedMetadata) {
    console.log('🔧 [DEBUG] ========== FULL DIAGNOSTIC START ==========');
    
    // 1. Check endpoint
    console.log('\n📍 Step 1: Checking endpoint health...');
    const endpointOk = await this.checkEndpointHealth();
    
    // 2. Test extraction
    console.log('\n📍 Step 2: Testing backend extraction...');
    const extractionResult = await this.testBackendExtraction(pdfFile);
    
    // 3. Verify extracted metadata
    console.log('\n📍 Step 3: Verifying extractedMetadata state...');
    const metadataOk = this.verifyExtractedMetadata(extractedMetadata);
    
    // 4. Summary
    console.log('\n📍 Step 4: Diagnostic Summary');
    console.log('✅ = Working | ❌ = Failed | ⚠️ = Warning');
    console.log(`${endpointOk ? '✅' : '❌'} Endpoint accessible`);
    console.log(`${extractionResult.success ? '✅' : '❌'} Backend extraction working`);
    console.log(`${metadataOk ? '✅' : '⚠️'} Extracted metadata state valid`);
    
    console.log('\n🔧 [DEBUG] ========== FULL DIAGNOSTIC END ==========');
    
    return {
      endpointOk,
      extractionOk: extractionResult.success,
      metadataOk,
      allOk: endpointOk && extractionResult.success && metadataOk
    };
  }
};

// Usage in browser console:
/*

// 1. Test backend directly
const file = document.querySelector('input[type="file"]').files[0];
window.debugExtraction.testBackendExtraction(file);

// 2. Check endpoint
window.debugExtraction.checkEndpointHealth();

// 3. Full diagnostic
window.debugExtraction.runFullDiagnostic(file, window.extractedMetadata);

// 4. Verify extraction state
window.debugExtraction.verifyExtractedMetadata(window.extractedMetadata);

*/
