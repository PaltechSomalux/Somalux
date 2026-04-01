import './AccountTypeSelector.css';
import { 
  FaBriefcase, FaUser,
  FaUtensils, FaPaintbrush, FaChalkboardUser, FaScaleBalanced, FaCode, FaMicrochip, FaStethoscope, FaBuildingColumns,
  FaHammer, FaHeartPulse, FaCamera, FaMusic, FaBook, FaLaptop, FaServer, FaChartLine, FaCartShopping, FaBuilding,
  FaTruck, FaWrench, FaPlane, FaHotel, FaBus, FaGraduationCap, FaFlask,
  FaPalette, FaGear, FaFileContract, FaAward, FaChartBar, FaLeaf, FaPhone, FaClipboard
} from 'react-icons/fa6';
import { useState, useRef, useEffect } from 'react';

const PROFESSION_TEMPLATES = [
  // Technology Sector - Employees
  { id: 'developer', name: 'Software Developer', icon: FaCode, type: 'employee', sector: 'Technology', description: 'Build applications & software' },
  { id: 'frontend-dev', name: 'Frontend Developer', icon: FaLaptop, type: 'employee', sector: 'Technology', description: 'Web interface development' },
  { id: 'backend-dev', name: 'Backend Developer', icon: FaServer, type: 'employee', sector: 'Technology', description: 'Server-side development' },
  { id: 'devops', name: 'DevOps Engineer', icon: FaGear, type: 'employee', sector: 'Technology', description: 'Infrastructure & deployment' },
  { id: 'data-scientist', name: 'Data Scientist', icon: FaChartBar, type: 'employee', sector: 'Technology', description: 'Data analysis & AI' },
  { id: 'qa-engineer', name: 'QA Engineer', icon: FaAward, type: 'employee', sector: 'Technology', description: 'Quality assurance testing' },
  
  // Healthcare Sector - Employees
  { id: 'doctor', name: 'Doctor', icon: FaStethoscope, type: 'employee', sector: 'Healthcare', description: 'Medical practitioner' },
  { id: 'nurse', name: 'Nurse', icon: FaHeartPulse, type: 'employee', sector: 'Healthcare', description: 'Healthcare provider' },
  { id: 'therapist', name: 'Therapist', icon: FaHeartPulse, type: 'employee', sector: 'Healthcare', description: 'Mental health specialist' },
  { id: 'pharmacist', name: 'Pharmacist', icon: FaMicrochip, type: 'employee', sector: 'Healthcare', description: 'Medication specialist' },
  { id: 'dentist', name: 'Dentist', icon: FaStethoscope, type: 'employee', sector: 'Healthcare', description: 'Dental professional' },
  { id: 'veterinarian', name: 'Veterinarian', icon: FaStethoscope, type: 'employee', sector: 'Healthcare', description: 'Animal healthcare' },
  
  // Hospitality & Food Sector - Employees
  { id: 'chef', name: 'Chef', icon: FaUtensils, type: 'employee', sector: 'Hospitality', description: 'Culinary expert' },
  { id: 'sous-chef', name: 'Sous Chef', icon: FaUtensils, type: 'employee', sector: 'Hospitality', description: 'Kitchen manager' },
  { id: 'waiter', name: 'Waiter/Waitress', icon: FaUtensils, type: 'employee', sector: 'Hospitality', description: 'Restaurant service' },
  { id: 'bartender', name: 'Bartender', icon: FaUtensils, type: 'employee', sector: 'Hospitality', description: 'Bar service expert' },
  { id: 'hotel-manager', name: 'Hotel Manager', icon: FaHotel, type: 'employee', sector: 'Hospitality', description: 'Hospitality management' },
  { id: 'housekeeper', name: 'Housekeeper', icon: FaBuilding, type: 'employee', sector: 'Hospitality', description: 'Facility cleaning & maintenance' },
  
  // Education Sector - Employees
  { id: 'teacher', name: 'Teacher', icon: FaChalkboardUser, type: 'employee', sector: 'Education', description: 'Classroom instructor' },
  { id: 'professor', name: 'Professor', icon: FaBook, type: 'employee', sector: 'Education', description: 'University educator' },
  { id: 'tutor', name: 'Tutor', icon: FaGraduationCap, type: 'employee', sector: 'Education', description: 'Private instruction' },
  { id: 'guidance-counselor', name: 'Guidance Counselor', icon: FaChalkboardUser, type: 'employee', sector: 'Education', description: 'Student advisor' },
  { id: 'curriculum-designer', name: 'Curriculum Designer', icon: FaBook, type: 'employee', sector: 'Education', description: 'Course development' },
  
  // Creative & Design Sector - Employees
  { id: 'graphic-designer', name: 'Graphic Designer', icon: FaPaintbrush, type: 'employee', sector: 'Creative', description: 'Visual design expert' },
  { id: 'ux-designer', name: 'UX Designer', icon: FaPalette, type: 'employee', sector: 'Creative', description: 'User experience design' },
  { id: 'animator', name: 'Animator', icon: FaCamera, type: 'employee', sector: 'Creative', description: 'Motion graphics specialist' },
  { id: 'photographer', name: 'Photographer', icon: FaCamera, type: 'employee', sector: 'Creative', description: 'Photography professional' },
  { id: 'videographer', name: 'Videographer', icon: FaCamera, type: 'employee', sector: 'Creative', description: 'Video production' },
  { id: 'content-creator', name: 'Content Creator', icon: FaMusic, type: 'employee', sector: 'Creative', description: 'Digital content production' },
  
  // Legal & Finance Sector - Employees
  { id: 'lawyer', name: 'Lawyer', icon: FaScaleBalanced, type: 'employee', sector: 'Legal', description: 'Legal professional' },
  { id: 'accountant', name: 'Accountant', icon: FaChartLine, type: 'employee', sector: 'Legal', description: 'Financial accounting' },
  { id: 'financial-advisor', name: 'Financial Advisor', icon: FaChartBar, type: 'employee', sector: 'Legal', description: 'Investment specialist' },
  { id: 'tax-consultant', name: 'Tax Consultant', icon: FaFileContract, type: 'employee', sector: 'Legal', description: 'Tax planning expert' },
  { id: 'hr-specialist', name: 'HR Specialist', icon: FaBriefcase, type: 'employee', sector: 'Legal', description: 'Human resources' },
  
  // Construction & Trades - Employees
  { id: 'electrician', name: 'Electrician', icon: FaWrench, type: 'employee', sector: 'Trades', description: 'Electrical specialist' },
  { id: 'plumber', name: 'Plumber', icon: FaWrench, type: 'employee', sector: 'Trades', description: 'Plumbing expert' },
  { id: 'carpenter', name: 'Carpenter', icon: FaHammer, type: 'employee', sector: 'Trades', description: 'Woodworking specialist' },
  { id: 'contractor', name: 'Contractor', icon: FaBuilding, type: 'employee', sector: 'Trades', description: 'Construction management' },
  { id: 'hvac-technician', name: 'HVAC Technician', icon: FaGear, type: 'employee', sector: 'Trades', description: 'Heating & cooling systems' },
  
  // Transportation & Logistics - Employees
  { id: 'truck-driver', name: 'Truck Driver', icon: FaTruck, type: 'employee', sector: 'Transportation', description: 'Long-haul delivery' },
  { id: 'pilot', name: 'Pilot', icon: FaPlane, type: 'employee', sector: 'Transportation', description: 'Aircraft operation' },
  { id: 'logistics-manager', name: 'Logistics Manager', icon: FaTruck, type: 'employee', sector: 'Transportation', description: 'Supply chain management' },
  { id: 'delivery-driver', name: 'Delivery Driver', icon: FaTruck, type: 'employee', sector: 'Transportation', description: 'Package delivery' },
  { id: 'bus-driver', name: 'Bus Driver', icon: FaBus, type: 'employee', sector: 'Transportation', description: 'Public transit operation' },
  
  // Retail & Sales - Employees
  { id: 'sales-representative', name: 'Sales Representative', icon: FaCartShopping, type: 'employee', sector: 'Retail', description: 'Sales & client relations' },
  { id: 'retail-manager', name: 'Retail Manager', icon: FaCartShopping, type: 'employee', sector: 'Retail', description: 'Store management' },
  { id: 'cashier', name: 'Cashier', icon: FaCartShopping, type: 'employee', sector: 'Retail', description: 'Point of sale operations' },
  { id: 'customer-service', name: 'Customer Service Rep', icon: FaPhone, type: 'employee', sector: 'Retail', description: 'Customer support' },
  { id: 'merchandiser', name: 'Merchandiser', icon: FaCartShopping, type: 'employee', sector: 'Retail', description: 'Product display & inventory' },
  
  // Media & Entertainment - Employees
  { id: 'journalist', name: 'Journalist', icon: FaBook, type: 'employee', sector: 'Media', description: 'News reporting' },
  { id: 'musician', name: 'Musician', icon: FaMusic, type: 'employee', sector: 'Media', description: 'Music professional' },
  { id: 'actor', name: 'Actor', icon: FaCamera, type: 'employee', sector: 'Media', description: 'Performance arts' },
  { id: 'producer', name: 'Producer', icon: FaMusic, type: 'employee', sector: 'Media', description: 'Content production' },
  
  // Science & Research - Employees
  { id: 'scientist', name: 'Scientist', icon: FaFlask, type: 'employee', sector: 'Science', description: 'Scientific research' },
  { id: 'lab-technician', name: 'Lab Technician', icon: FaFlask, type: 'employee', sector: 'Science', description: 'Laboratory work' },
  { id: 'biologist', name: 'Biologist', icon: FaFlask, type: 'employee', sector: 'Science', description: 'Biological research' },
  { id: 'chemist', name: 'Chemist', icon: FaFlask, type: 'employee', sector: 'Science', description: 'Chemistry specialist' },
  
  // Business Services - Employees
  { id: 'consultant', name: 'Business Consultant', icon: FaBuildingColumns, type: 'employee', sector: 'Business', description: 'Business strategy' },
  { id: 'marketing-manager', name: 'Marketing Manager', icon: FaChartBar, type: 'employee', sector: 'Business', description: 'Marketing leadership' },
  { id: 'project-manager', name: 'Project Manager', icon: FaClipboard, type: 'employee', sector: 'Business', description: 'Project coordination' },
  { id: 'analyst', name: 'Business Analyst', icon: FaChartBar, type: 'employee', sector: 'Business', description: 'Data analysis & insights' },
  { id: 'operations-manager', name: 'Operations Manager', icon: FaBriefcase, type: 'employee', sector: 'Business', description: 'Business operations' },
  { id: 'product-manager', name: 'Product Manager', icon: FaChartBar, type: 'employee', sector: 'Business', description: 'Product strategy & development' },
  { id: 'sales-director', name: 'Sales Director', icon: FaCartShopping, type: 'employee', sector: 'Business', description: 'Sales management' },
  
  // Environmental - Employees
  { id: 'environmental-scientist', name: 'Environmental Scientist', icon: FaLeaf, type: 'employee', sector: 'Environmental', description: 'Environmental protection' },
  { id: 'sustainability-specialist', name: 'Sustainability Specialist', icon: FaLeaf, type: 'employee', sector: 'Environmental', description: 'Sustainability planning' },
  
  // ===== EMPLOYERS =====
  
  // Technology Sector - Employers
  { id: 'tech-startup', name: 'Tech Startup', icon: FaCode, type: 'employer', sector: 'Technology', description: 'Early-stage tech company' },
  { id: 'saas-company', name: 'SaaS Company', icon: FaServer, type: 'employer', sector: 'Technology', description: 'Software-as-a-service provider' },
  { id: 'tech-corporation', name: 'Tech Corporation', icon: FaMicrochip, type: 'employer', sector: 'Technology', description: 'Large technology firm' },
  { id: 'software-house', name: 'Software House', icon: FaCode, type: 'employer', sector: 'Technology', description: 'Custom software development' },
  
  // Healthcare Sector - Employers
  { id: 'hospital', name: 'Hospital', icon: FaStethoscope, type: 'employer', sector: 'Healthcare', description: 'Medical facility' },
  { id: 'clinic', name: 'Clinic', icon: FaHeartPulse, type: 'employer', sector: 'Healthcare', description: 'Outpatient healthcare' },
  { id: 'pharmaceutical', name: 'Pharmaceutical Company', icon: FaMicrochip, type: 'employer', sector: 'Healthcare', description: 'Drug manufacturing & research' },
  { id: 'medical-device', name: 'Medical Device Company', icon: FaMicrochip, type: 'employer', sector: 'Healthcare', description: 'Medical equipment manufacturer' },
  
  // Hospitality & Food - Employers
  { id: 'restaurant', name: 'Restaurant', icon: FaUtensils, type: 'employer', sector: 'Hospitality', description: 'Food service business' },
  { id: 'hotel', name: 'Hotel Chain', icon: FaHotel, type: 'employer', sector: 'Hospitality', description: 'Lodging provider' },
  { id: 'catering-company', name: 'Catering Company', icon: FaUtensils, type: 'employer', sector: 'Hospitality', description: 'Event catering services' },
  { id: 'cafe', name: 'Café/Bakery', icon: FaUtensils, type: 'employer', sector: 'Hospitality', description: 'Café & bakery business' },
  { id: 'resort', name: 'Resort', icon: FaHotel, type: 'employer', sector: 'Hospitality', description: 'Holiday resort' },
  
  // Education - Employers
  { id: 'school', name: 'School', icon: FaChalkboardUser, type: 'employer', sector: 'Education', description: 'Primary/Secondary school' },
  { id: 'university', name: 'University', icon: FaGraduationCap, type: 'employer', sector: 'Education', description: 'Higher education institution' },
  { id: 'training-center', name: 'Training Center', icon: FaBook, type: 'employer', sector: 'Education', description: 'Vocational training provider' },
  { id: 'online-academy', name: 'Online Academy', icon: FaLaptop, type: 'employer', sector: 'Education', description: 'E-learning platform' },
  
  // Creative & Design - Employers
  { id: 'design-agency', name: 'Design Agency', icon: FaPaintbrush, type: 'employer', sector: 'Creative', description: 'Creative design firm' },
  { id: 'advertising-agency', name: 'Advertising Agency', icon: FaChartBar, type: 'employer', sector: 'Creative', description: 'Advertising & marketing firm' },
  { id: 'production-house', name: 'Production House', icon: FaCamera, type: 'employer', sector: 'Creative', description: 'Film & video production' },
  { id: 'music-studio', name: 'Music Studio', icon: FaMusic, type: 'employer', sector: 'Creative', description: 'Recording & music production' },
  
  // Legal & Finance - Employers
  { id: 'law-firm', name: 'Law Firm', icon: FaScaleBalanced, type: 'employer', sector: 'Legal', description: 'Legal services' },
  { id: 'accounting-firm', name: 'Accounting Firm', icon: FaChartLine, type: 'employer', sector: 'Legal', description: 'Accounting & auditing' },
  { id: 'investment-bank', name: 'Investment Bank', icon: FaChartBar, type: 'employer', sector: 'Legal', description: 'Banking & investment services' },
  { id: 'insurance-company', name: 'Insurance Company', icon: FaAward, type: 'employer', sector: 'Legal', description: 'Insurance provider' },
  
  // Construction & Trades - Employers
  { id: 'construction-company', name: 'Construction Company', icon: FaHammer, type: 'employer', sector: 'Trades', description: 'Building & construction' },
  { id: 'engineering-firm', name: 'Engineering Firm', icon: FaGear, type: 'employer', sector: 'Trades', description: 'Engineering services' },
  { id: 'home-services', name: 'Home Services', icon: FaWrench, type: 'employer', sector: 'Trades', description: 'Home repair & maintenance' },
  
  // Transportation & Logistics - Employers
  { id: 'logistics-company', name: 'Logistics Company', icon: FaTruck, type: 'employer', sector: 'Transportation', description: 'Supply chain & delivery' },
  { id: 'airline', name: 'Airline', icon: FaPlane, type: 'employer', sector: 'Transportation', description: 'Air transportation' },
  { id: 'shipping-company', name: 'Shipping Company', icon: FaTruck, type: 'employer', sector: 'Transportation', description: 'Freight & shipping' },
  { id: 'transit-authority', name: 'Transit Authority', icon: FaBus, type: 'employer', sector: 'Transportation', description: 'Public transportation' },
  
  // Retail & Sales - Employers
  { id: 'retail-chain', name: 'Retail Chain', icon: FaCartShopping, type: 'employer', sector: 'Retail', description: 'Multi-store retailer' },
  { id: 'ecommerce-store', name: 'E-Commerce Store', icon: FaCartShopping, type: 'employer', sector: 'Retail', description: 'Online retail platform' },
  { id: 'mall', name: 'Shopping Mall', icon: FaCartShopping, type: 'employer', sector: 'Retail', description: 'Shopping center' },
  { id: 'call-center', name: 'Call Center', icon: FaPhone, type: 'employer', sector: 'Retail', description: 'Customer service center' },
  
  // Media & Entertainment - Employers
  { id: 'media-company', name: 'Media Company', icon: FaBook, type: 'employer', sector: 'Media', description: 'News & media outlet' },
  { id: 'streaming-service', name: 'Streaming Service', icon: FaCamera, type: 'employer', sector: 'Media', description: 'Digital content platform' },
  { id: 'entertainment-studio', name: 'Entertainment Studio', icon: FaMusic, type: 'employer', sector: 'Media', description: 'Film & entertainment' },
  
  // Business Services - Employers
  { id: 'consulting-firm', name: 'Consulting Firm', icon: FaBuildingColumns, type: 'employer', sector: 'Business', description: 'Management consulting' },
  { id: 'marketing-firm', name: 'Marketing Firm', icon: FaChartBar, type: 'employer', sector: 'Business', description: 'Marketing & branding' },
  { id: 'corporate', name: 'Corporation', icon: FaBuilding, type: 'employer', sector: 'Business', description: 'Large enterprise' },
  { id: 'startup-accelerator', name: 'Startup Accelerator', icon: FaCode, type: 'employer', sector: 'Business', description: 'Startup mentorship & funding' },
  { id: 'recruitment-firm', name: 'Recruitment Firm', icon: FaBriefcase, type: 'employer', sector: 'Business', description: 'Talent acquisition services' },
  { id: 'business-solutions', name: 'Business Solutions', icon: FaChartBar, type: 'employer', sector: 'Business', description: 'Enterprise software & services' },
  { id: 'management-firm', name: 'Management Firm', icon: FaBuildingColumns, type: 'employer', sector: 'Business', description: 'Business management services' },
  { id: 'training-institute', name: 'Training Institute', icon: FaBook, type: 'employer', sector: 'Business', description: 'Professional development & training' },
  
  // Environmental - Employers
  { id: 'green-energy', name: 'Green Energy Company', icon: FaLeaf, type: 'employer', sector: 'Environmental', description: 'Renewable energy provider' },
  { id: 'environmental-org', name: 'Environmental Organization', icon: FaLeaf, type: 'employer', sector: 'Environmental', description: 'Environmental nonprofit' },
];

function AccountTypeSelector({ onSelectAccountType, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [scrollStates, setScrollStates] = useState({});
  const [cardOrder, setCardOrder] = useState([]);
  const [sectorOrder, setSectorOrder] = useState([]);
  const [, setIsMobile] = useState(window.innerWidth <= 768);
  const scrollRefsRef = useRef({});
  const isShufflingRef = useRef(false);
  const isSectorShufflingRef = useRef(false);

  // Function to check if scroll is needed for a sector
  const checkScroll = (sectorKey) => {
    const scrollElement = scrollRefsRef.current[sectorKey];
    if (scrollElement) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollElement;
      setScrollStates(prev => ({
        ...prev,
        [sectorKey]: {
          canScrollLeft: scrollLeft > 0,
          canScrollRight: scrollLeft < scrollWidth - clientWidth - 10
        }
      }));
    }
  };

  // Handle scroll button clicks
  const handleScroll = (sectorKey, direction) => {
    const scrollElement = scrollRefsRef.current[sectorKey];
    if (scrollElement) {
      const scrollAmount = 250;
      scrollElement.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(() => checkScroll(sectorKey), 100);
    }
  };

  // Store ref without triggering setState
  const handleScrollCheck = (sectorKey, el) => {
    if (el) {
      scrollRefsRef.current[sectorKey] = el;
    }
  };

  // Get unique sectors
  const sectors = ['all', ...new Set(PROFESSION_TEMPLATES.map(prof => prof.sector))].sort((a, b) => {
    if (a === 'all') return -1;
    return a.localeCompare(b);
  });

  const filteredProfessions = PROFESSION_TEMPLATES.filter(prof => {
    const matchesSearch = prof.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prof.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || prof.type === selectedType;
    const matchesSector = selectedSector === 'all' || prof.sector === selectedSector;
    return matchesSearch && matchesType && matchesSector;
  });

  // Group filtered professions by sector for display
  const groupedProfessions = sectors.reduce((acc, sector) => {
    if (sector !== 'all') {
      const sectorProfs = filteredProfessions.filter(p => p.sector === sector);
      if (sectorProfs.length > 0) {
        acc[sector] = sectorProfs;
      }
    }
    return acc;
  }, {});

  // Initialize scroll states after render
  useEffect(() => {
    // Use setTimeout to ensure DOM is fully rendered before checking
    const timer = setTimeout(() => {
      Object.keys(scrollRefsRef.current).forEach(sectorKey => {
        checkScroll(sectorKey);
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [filteredProfessions]);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Recheck scroll states on resize
      setTimeout(() => {
        Object.keys(scrollRefsRef.current).forEach(sectorKey => {
          checkScroll(sectorKey);
        });
      }, 0);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize and shuffle card order on page load
  useEffect(() => {
    const initialOrder = [...Array(PROFESSION_TEMPLATES.length).keys()];
    // Do initial shuffle
    const shuffled = [...initialOrder];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setCardOrder(shuffled);
  }, []);

  // Shuffle individual cards randomly at staggered intervals
  useEffect(() => {
    const interval = setInterval(() => {
      // Only shuffle if not currently shuffling
      if (!isShufflingRef.current) {
        isShufflingRef.current = true;
        setCardOrder(prevOrder => {
          const newOrder = [...prevOrder];
          // Swap only 1 pair of random cards
          const i = Math.floor(Math.random() * newOrder.length);
          const j = Math.floor(Math.random() * newOrder.length);
          if (i !== j) {
            [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]];
          }
          return newOrder;
        });
        
        // Wait for transition to complete before allowing next shuffle
        setTimeout(() => {
          isShufflingRef.current = false;
        }, 2000);
      }
    }, 30000); // Every 30 seconds, shuffle one card

    return () => clearInterval(interval);
  }, []);

  // Initialize and shuffle sector order on page load
  useEffect(() => {
    const sectors_list = Object.keys(groupedProfessions);
    const initialSectorOrder = [...Array(sectors_list.length).keys()];
    // Do initial shuffle
    const shuffled = [...initialSectorOrder];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setSectorOrder(shuffled);
  }, [groupedProfessions]);

  // Shuffle sectors randomly at staggered intervals
  useEffect(() => {
    const interval = setInterval(() => {
      // Only shuffle if not currently shuffling
      if (!isSectorShufflingRef.current) {
        isSectorShufflingRef.current = true;
        setSectorOrder(prevOrder => {
          const newOrder = [...prevOrder];
          // Swap only 1 pair of random sectors
          const i = Math.floor(Math.random() * newOrder.length);
          const j = Math.floor(Math.random() * newOrder.length);
          if (i !== j) {
            [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]];
          }
          return newOrder;
        });
        
        // Wait for transition to complete before allowing next shuffle
        setTimeout(() => {
          isSectorShufflingRef.current = false;
        }, 2000);
      }
    }, 30000); // Every 30 seconds, shuffle one sector

    return () => clearInterval(interval);
  }, []);

  const handleSelectProfession = (profession) => {
    onSelectAccountType(profession.type, profession);
  };

  return (
    <div className="account-type-page">
      <div className="page-header">
        <div className="header-left">
        </div>
        <div className="header-center">
          <h1>JobLink</h1>
        </div>
        <div className="header-right">
          {/* Placeholder for future navigation items */}
        </div>
      </div>

      <div className="page-content">
        <div className="welcome-header">
          <h2 className="welcome-title">Find Your Role</h2>
          <p className="welcome-subtitle">Search or filter to find your profession template</p>
        </div>

        <div className="search-section">
          <div className="search-bar">
            <textarea 
              placeholder="Search professions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
                        rows="1"
                      />
          </div>

          <div className="filter-buttons">
            <div className="filter-group">
              <label className="filter-label">Account:</label>
              <div className="button-group">
                <button 
                  className={`filter-btn ${selectedType === 'employee' ? 'active' : ''}`}
                  onClick={() => setSelectedType('employee')}
                >
                  <FaUser /> Job Seeker
                </button>
                <button 
                  className={`filter-btn ${selectedType === 'employer' ? 'active' : ''}`}
                  onClick={() => setSelectedType('employer')}
                >
                  <FaBriefcase /> Employer
                </button>
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Sector:</label>
              <div className="sector-filters">
                {sectors.map(sector => (
                  <button
                    key={sector}
                    className={`sector-btn ${selectedSector === sector ? 'active' : ''}`}
                    onClick={() => setSelectedSector(sector)}
                  >
                    {sector === 'all' ? 'All Sectors' : sector}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {filteredProfessions.length > 0 ? (
          <div className="professions-by-sector">
            {Object.entries(groupedProfessions).map(([sector, professions], sectorIndex) => {
              const sectorKey = `sector-${sector}`;
              const state = scrollStates[sectorKey] || { canScrollLeft: false, canScrollRight: true };
              const sectorVisualOrder = sectorOrder[sectorIndex] !== undefined ? sectorOrder[sectorIndex] : sectorIndex;
              return (
                <div 
                  key={sector} 
                  className="sector-group scrollable-sector"
                  style={{ order: sectorVisualOrder }}
                >
                  <h3 className="sector-title">{sector}</h3>
                  {state.canScrollLeft && (
                    <button 
                      className="scroll-btn scroll-btn-left"
                      onClick={() => handleScroll(sectorKey, 'left')}
                      aria-label="Scroll left"
                    >
                      ‹
                    </button>
                  )}
                  <div 
                    className="professions-scroll"
                    ref={(el) => handleScrollCheck(sectorKey, el)}
                    onScroll={() => checkScroll(sectorKey)}
                  >
                    {professions.map(profession => {
                      const IconComponent = profession.icon;
                      const baseIndex = PROFESSION_TEMPLATES.findIndex(p => p.id === profession.id);
                      const newIndex = cardOrder[baseIndex];
                      return (
                        <div 
                          key={profession.id}
                          className="profession-card"
                          onClick={() => handleSelectProfession(profession)}
                          style={{ order: newIndex }}
                        >
                          <div className="profession-icon">
                            <IconComponent />
                          </div>
                          <h3>{profession.name}</h3>
                          <p className="profession-description">{profession.description}</p>
                          <div className={`profession-type ${profession.type}`}>
                            {profession.type === 'employee' ? 'Job Seeker' : 'Employer'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {state.canScrollRight && (
                    <button 
                      className="scroll-btn scroll-btn-right"
                      onClick={() => handleScroll(sectorKey, 'right')}
                      aria-label="Scroll right"
                    >
                      ›
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-results">
            <p>No professions found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AccountTypeSelector;
