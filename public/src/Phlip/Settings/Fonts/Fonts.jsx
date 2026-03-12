import React, { useState, useEffect } from "react";
import "./Font.css";

export const Fonts = () => {
  // Font options with categories
  const fontOptions = [
    {
      category: "Sans-Serif",
      fonts: [
        { value: "'Inter', sans-serif", label: "Inter", variable: true },
        { value: "'Roboto', sans-serif", label: "Roboto", variable: false },
        { value: "'Open Sans', sans-serif", label: "Open Sans", variable: true },
        { value: "'Montserrat', sans-serif", label: "Montserrat", variable: false },
        { value: "'Poppins', sans-serif", label: "Poppins", variable: false },
        { value: "'Nunito Sans', sans-serif", label: "Nunito Sans", variable: true }
      ]
    },
    {
      category: "Serif",
      fonts: [
        { value: "'Lora', serif", label: "Lora", variable: false },
        { value: "'Playfair Display', serif", label: "Playfair", variable: true },
        { value: "'Merriweather', serif", label: "Merriweather", variable: false },
        { value: "'Source Serif Pro', serif", label: "Source Serif", variable: true },
        { value: "'Libre Baskerville', serif", label: "Baskerville", variable: false }
      ]
    },
    {
      category: "Monospace",
      fonts: [
        { value: "'Courier Prime', monospace", label: "Courier Prime", variable: false },
        { value: "'Roboto Mono', monospace", label: "Roboto Mono", variable: true },
        { value: "'Fira Code', monospace", label: "Fira Code", variable: false },
        { value: "'IBM Plex Mono', monospace", label: "IBM Plex", variable: true }
      ]
    },
    {
      category: "Display",
      fonts: [
        { value: "'Comic Neue', cursive", label: "Comic Neue", variable: false },
        { value: "'Pacifico', cursive", label: "Pacifico", variable: false },
        { value: "'Dancing Script', cursive", label: "Dancing Script", variable: false },
        { value: "'Bebas Neue', cursive", label: "Bebas Neue", variable: false }
      ]
    }
  ];

  // Initial state
  const initialState = {
    family: localStorage.getItem("fontFamily") || "'Inter', sans-serif",
    size: localStorage.getItem("fontSize") || "16",
    weight: localStorage.getItem("fontWeight") || "400",
    lineHeight: localStorage.getItem("lineHeight") || "1.5",
    letterSpacing: localStorage.getItem("letterSpacing") || "0",
    textTransform: localStorage.getItem("textTransform") || "none",
    textColor: localStorage.getItem("textColor") || "#333333",
    bgColor: localStorage.getItem("bgColor") || "#ffffff",
    linkColor: localStorage.getItem("linkColor") || "#0066cc",
    headingColor: localStorage.getItem("headingColor") || "#111111",
    customCSS: localStorage.getItem("customCSS") || "",
    fontSmoothing: localStorage.getItem("fontSmoothing") || "antialiased",
    paragraphMargin: localStorage.getItem("paragraphMargin") || "1em",
    headingMargin: localStorage.getItem("headingMargin") || "1.5em 0 0.5em",
    linkDecoration: localStorage.getItem("linkDecoration") || "underline",
    linkHoverColor: localStorage.getItem("linkHoverColor") || "#004499",
    borderRadius: localStorage.getItem("borderRadius") || "4",
    boxShadow: localStorage.getItem("boxShadow") || "0 2px 4px rgba(0,0,0,0.1)",
    transitionSpeed: localStorage.getItem("transitionSpeed") || "0.3s",
    maxWidth: localStorage.getItem("maxWidth") || "1200",
    containerPadding: localStorage.getItem("containerPadding") || "0 20px"
  };

  const [fontSettings, setFontSettings] = useState(initialState);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("typography");
  const [importExportValue, setImportExportValue] = useState("");
  const [showImportExport, setShowImportExport] = useState(false);

  // Apply font settings to entire app
  const applySettings = () => {
    const root = document.documentElement;
    
    // Font styles
    root.style.setProperty("--font-family", fontSettings.family);
    root.style.setProperty("--font-size", `${fontSettings.size}px`);
    root.style.setProperty("--font-weight", fontSettings.weight);
    root.style.setProperty("--line-height", fontSettings.lineHeight);
    root.style.setProperty("--letter-spacing", `${fontSettings.letterSpacing}px`);
    root.style.setProperty("--text-transform", fontSettings.textTransform);
    root.style.setProperty("--font-smoothing", fontSettings.fontSmoothing);
    
    // Colors
    root.style.setProperty("--text-color", fontSettings.textColor);
    root.style.setProperty("--bg-color", fontSettings.bgColor);
    root.style.setProperty("--link-color", fontSettings.linkColor);
    root.style.setProperty("--heading-color", fontSettings.headingColor);
    root.style.setProperty("--link-hover-color", fontSettings.linkHoverColor);
    
    // Spacing
    root.style.setProperty("--paragraph-margin", fontSettings.paragraphMargin);
    root.style.setProperty("--heading-margin", fontSettings.headingMargin);
    root.style.setProperty("--container-padding", fontSettings.containerPadding);
    
    // Layout
    root.style.setProperty("--max-width", `${fontSettings.maxWidth}px`);
    root.style.setProperty("--border-radius", `${fontSettings.borderRadius}px`);
    root.style.setProperty("--box-shadow", fontSettings.boxShadow);
    root.style.setProperty("--transition-speed", fontSettings.transitionSpeed);
    
    // Link decoration
    root.style.setProperty("--link-decoration", fontSettings.linkDecoration);
    
    // Custom CSS
    const styleTag = document.getElementById("custom-font-styles") || 
      document.head.appendChild(document.createElement("style"));
    styleTag.id = "custom-font-styles";
    styleTag.textContent = fontSettings.customCSS;
  };

  // Apply settings on mount and when settings change
  useEffect(() => {
    applySettings();
  }, [fontSettings]); // Now runs when fontSettings change

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFontSettings(prev => ({ ...prev, [name]: value }));
    setIsSaved(false);
  };

  const handleColorChange = (name, color) => {
    setFontSettings(prev => ({ ...prev, [name]: color }));
    setIsSaved(false);
  };

  const saveSettings = () => {
    // Save to localStorage
    Object.entries(fontSettings).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    // Apply to entire app
    applySettings();
    setIsSaved(true);
    
    // Reset saved status after 3 seconds
    setTimeout(() => setIsSaved(false), 3000);
  };

  const resetDefaults = () => {
    setFontSettings(initialState);
    setIsSaved(false);
  };

  const exportSettings = () => {
    const settingsString = JSON.stringify(fontSettings, null, 2);
    setImportExportValue(settingsString);
    setShowImportExport(true);
  };

  const importSettings = () => {
    try {
      const parsedSettings = JSON.parse(importExportValue);
      setFontSettings(parsedSettings);
      setShowImportExport(false);
    } catch (error) {
      alert("Invalid settings format. Please check your input.");
    }
  };

  const getCurrentFontInfo = () => {
    const currentFont = fontOptions
      .flatMap(category => category.fonts)
      .find(font => font.value === fontSettings.family);
    
    return currentFont || { label: "Custom", variable: false };
  };

  const currentFont = getCurrentFontInfo();

  return (
    <div className="font-customizer">
      <h2 className="customizer-title">Design System Customizer</h2>
      
      {/* Navigation Tabs */}
      <div className="tabs">
        <button 
          className={activeTab === "typography" ? "active" : ""}
          onClick={() => setActiveTab("typography")}
        >
          Typography
        </button>
        <button 
          className={activeTab === "colors" ? "active" : ""}
          onClick={() => setActiveTab("colors")}
        >
          Colors
        </button>
        <button 
          className={activeTab === "spacing" ? "active" : ""}
          onClick={() => setActiveTab("spacing")}
        >
          Spacing & Layout
        </button>
        <button 
          className={activeTab === "advanced" ? "active" : ""}
          onClick={() => setActiveTab("advanced")}
        >
          Advanced
        </button>
      </div>
      
      {/* Typography Tab */}
      {activeTab === "typography" && (
        <div className="settings-grid">
          {/* Font Family */}
          <div className="control-group">
            <label>Font Family</label>
            <select
              name="family"
              value={fontSettings.family}
              onChange={handleChange}
            >
              {fontOptions.map((category) => (
                <optgroup key={category.category} label={category.category}>
                  {category.fonts.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label} {font.variable && "(Variable)"}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {currentFont.variable && (
              <div className="font-info">
                This font supports variable axes. Try adjusting the weight slider!
              </div>
            )}
          </div>

          {/* Text Styles */}
          <div className="control-group">
            <label>Base Font Size: {fontSettings.size}px</label>
            <input
              name="size"
              type="range"
              min="12"
              max="32"
              value={fontSettings.size}
              onChange={handleChange}
            />
          </div>

          <div className="control-group">
            <label>Font Weight: {fontSettings.weight}</label>
            <input
              name="weight"
              type="range"
              min="100"
              max="900"
              step="100"
              value={fontSettings.weight}
              onChange={handleChange}
            />
          </div>

          <div className="control-group">
            <label>Line Height: {fontSettings.lineHeight}</label>
            <input
              name="lineHeight"
              type="range"
              min="1"
              max="2.5"
              step="0.1"
              value={fontSettings.lineHeight}
              onChange={handleChange}
            />
          </div>

          <div className="control-group">
            <label>Letter Spacing: {fontSettings.letterSpacing}px</label>
            <input
              name="letterSpacing"
              type="range"
              min="-1"
              max="5"
              step="0.1"
              value={fontSettings.letterSpacing}
              onChange={handleChange}
            />
          </div>

          <div className="control-group">
            <label>Font Smoothing</label>
            <select
              name="fontSmoothing"
              value={fontSettings.fontSmoothing}
              onChange={handleChange}
            >
              <option value="antialiased">Antialiased</option>
              <option value="subpixel-antialiased">Subpixel Antialiased</option>
              <option value="none">None</option>
            </select>
          </div>

          <div className="control-group">
            <label>Text Transform</label>
            <select
              name="textTransform"
              value={fontSettings.textTransform}
              onChange={handleChange}
            >
              <option value="none">None</option>
              <option value="uppercase">Uppercase</option>
              <option value="lowercase">Lowercase</option>
              <option value="capitalize">Capitalize</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Colors Tab */}
      {activeTab === "colors" && (
        <div className="settings-grid">
          <div className="control-group">
            <label>Text Color</label>
            <div className="color-picker">
              <input
                type="color"
                value={fontSettings.textColor}
                onChange={(e) => handleColorChange("textColor", e.target.value)}
              />
              <span>{fontSettings.textColor}</span>
            </div>
          </div>

          <div className="control-group">
            <label>Heading Color</label>
            <div className="color-picker">
              <input
                type="color"
                value={fontSettings.headingColor}
                onChange={(e) => handleColorChange("headingColor", e.target.value)}
              />
              <span>{fontSettings.headingColor}</span>
            </div>
          </div>

          <div className="control-group">
            <label>Background Color</label>
            <div className="color-picker">
              <input
                type="color"
                value={fontSettings.bgColor}
                onChange={(e) => handleColorChange("bgColor", e.target.value)}
              />
              <span>{fontSettings.bgColor}</span>
            </div>
          </div>

          <div className="control-group">
            <label>Link Color</label>
            <div className="color-picker">
              <input
                type="color"
                value={fontSettings.linkColor}
                onChange={(e) => handleColorChange("linkColor", e.target.value)}
              />
              <span>{fontSettings.linkColor}</span>
            </div>
          </div>

          <div className="control-group">
            <label>Link Hover Color</label>
            <div className="color-picker">
              <input
                type="color"
                value={fontSettings.linkHoverColor}
                onChange={(e) => handleColorChange("linkHoverColor", e.target.value)}
              />
              <span>{fontSettings.linkHoverColor}</span>
            </div>
          </div>

          <div className="control-group">
            <label>Link Decoration</label>
            <select
              name="linkDecoration"
              value={fontSettings.linkDecoration}
              onChange={handleChange}
            >
              <option value="underline">Underline</option>
              <option value="none">None</option>
              <option value="overline">Overline</option>
              <option value="line-through">Line Through</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Spacing & Layout Tab */}
      {activeTab === "spacing" && (
        <div className="settings-grid">
          <div className="control-group">
            <label>Paragraph Margin</label>
            <input
              name="paragraphMargin"
              type="text"
              value={fontSettings.paragraphMargin}
              onChange={handleChange}
              placeholder="e.g. 1em or 16px 0"
            />
          </div>

          <div className="control-group">
            <label>Heading Margin</label>
            <input
              name="headingMargin"
              type="text"
              value={fontSettings.headingMargin}
              onChange={handleChange}
              placeholder="e.g. 1.5em 0 0.5em"
            />
          </div>

          <div className="control-group">
            <label>Container Padding</label>
            <input
              name="containerPadding"
              type="text"
              value={fontSettings.containerPadding}
              onChange={handleChange}
              placeholder="e.g. 0 20px or 2rem"
            />
          </div>

          <div className="control-group">
            <label>Max Content Width: {fontSettings.maxWidth}px</label>
            <input
              name="maxWidth"
              type="range"
              min="600"
              max="2000"
              step="10"
              value={fontSettings.maxWidth}
              onChange={handleChange}
            />
          </div>

          <div className="control-group">
            <label>Border Radius: {fontSettings.borderRadius}px</label>
            <input
              name="borderRadius"
              type="range"
              min="0"
              max="20"
              step="1"
              value={fontSettings.borderRadius}
              onChange={handleChange}
            />
          </div>
        </div>
      )}
      
      {/* Advanced Tab */}
      {activeTab === "advanced" && (
        <div className="settings-grid">
          <div className="control-group">
            <label>Box Shadow</label>
            <input
              name="boxShadow"
              type="text"
              value={fontSettings.boxShadow}
              onChange={handleChange}
              placeholder="e.g. 0 2px 4px rgba(0,0,0,0.1)"
            />
          </div>

          <div className="control-group">
            <label>Transition Speed</label>
            <select
              name="transitionSpeed"
              value={fontSettings.transitionSpeed}
              onChange={handleChange}
            >
              <option value="0.1s">Fast (0.1s)</option>
              <option value="0.3s">Medium (0.3s)</option>
              <option value="0.5s">Slow (0.5s)</option>
              <option value="1s">Very Slow (1s)</option>
            </select>
          </div>

          <div className="control-group full-width">
            <label>Custom CSS</label>
            <textarea
              name="customCSS"
              value={fontSettings.customCSS}
              onChange={handleChange}
              placeholder="Add your custom CSS here..."
              rows="5"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="import-export-btn" onClick={exportSettings}>
          Export Settings
        </button>
        <button className="import-export-btn" onClick={() => {
          setImportExportValue("");
          setShowImportExport(true);
        }}>
          Import Settings
        </button>
        <button className="reset-btn" onClick={resetDefaults}>
          Reset Defaults
        </button>
        <button className="save-btn" onClick={saveSettings}>
          {isSaved ? "✓ Saved!" : "Save Settings"}
        </button>
      </div>

      {/* Import/Export Modal */}
      {showImportExport && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{importExportValue ? "Export Settings" : "Import Settings"}</h3>
            <textarea
              value={importExportValue}
              onChange={(e) => setImportExportValue(e.target.value)}
              rows="10"
              placeholder={importExportValue ? "" : "Paste your settings JSON here..."}
            />
            <div className="modal-buttons">
              {!importExportValue && (
                <button className="modal-btn primary" onClick={importSettings}>
                  Import
                </button>
              )}
              <button 
                className="modal-btn" 
                onClick={() => setShowImportExport(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};