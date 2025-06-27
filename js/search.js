/**
 * Search Functionality
 * 
 * This script provides search functionality for the website.
 * It searches through the content of the page and displays results in a modal.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');
  const searchModal = document.getElementById('search-results-modal');
  const searchResultsContainer = document.getElementById('search-results-container');
  const closeButton = document.querySelector('.search-close-btn');
  
  // Add event listeners
  searchButton.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  closeButton.addEventListener('click', closeSearchModal);
  
  // Close modal when clicking outside of it
  window.addEventListener('click', function(event) {
    if (event.target === searchModal) {
      closeSearchModal();
    }
  });
  
  // Close modal with Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && searchModal.classList.contains('active')) {
      closeSearchModal();
    }
  });
  
  /**
   * Perform search on the page content
   */
  function performSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (searchTerm.length < 2) {
      alert('Please enter at least 2 characters to search.');
      return;
    }
    
    // Clear previous results
    searchResultsContainer.innerHTML = '';
    
    // Get all text content from the page
    const sections = document.querySelectorAll('section');
    let results = [];
    
    // Search in each section
    sections.forEach(section => {
      const sectionId = section.id;
      const sectionTitle = section.querySelector('h2') ? section.querySelector('h2').textContent : 'Untitled Section';
      const sectionContent = section.textContent.toLowerCase();
      
      if (sectionContent.includes(searchTerm)) {
        // Extract context around the search term
        const contextResults = extractContexts(section, searchTerm);
        
        contextResults.forEach(context => {
          results.push({
            sectionId: sectionId,
            sectionTitle: sectionTitle,
            context: context
          });
        });
      }
    });
    
    // Display results
    if (results.length > 0) {
      results.forEach(result => {
        const resultElement = document.createElement('div');
        resultElement.className = 'search-result-item';
        
        resultElement.innerHTML = `
          <div class="search-result-title">${result.sectionTitle}</div>
          <div class="search-result-content">${result.context}</div>
        `;
        
        resultElement.addEventListener('click', function() {
          closeSearchModal();
          document.getElementById(result.sectionId).scrollIntoView({
            behavior: 'smooth'
          });
        });
        
        searchResultsContainer.appendChild(resultElement);
      });
    } else {
      searchResultsContainer.innerHTML = `
        <div class="no-results">
          <p>No results found for "${searchTerm}"</p>
        </div>
      `;
    }
    
    // Show modal
    searchModal.classList.add('active');
  }
  
  /**
   * Extract context around search term
   * @param {Element} element - The element to search in
   * @param {string} searchTerm - The term to search for
   * @returns {Array} - Array of context strings
   */
  function extractContexts(element, searchTerm) {
    const textNodes = [];
    const contexts = [];
    const maxContextLength = 100; // Maximum length of context before and after the search term
    
    // Get all text nodes in the element
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          return node.textContent.trim() !== '' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }
    
    // Find search term in text nodes and extract context
    textNodes.forEach(node => {
      const text = node.textContent.toLowerCase();
      let startIndex = 0;
      let index;
      
      // Find all occurrences of the search term
      while ((index = text.indexOf(searchTerm, startIndex)) > -1) {
        // Calculate context boundaries
        const contextStart = Math.max(0, index - maxContextLength);
        const contextEnd = Math.min(text.length, index + searchTerm.length + maxContextLength);
        
        // Extract context
        let context = node.textContent.substring(contextStart, contextEnd);
        
        // Add ellipsis if context is truncated
        if (contextStart > 0) {
          context = '...' + context;
        }
        if (contextEnd < text.length) {
          context += '...';
        }
        
        // Highlight search term in context
        const highlightedContext = highlightSearchTerm(context, searchTerm);
        
        contexts.push(highlightedContext);
        
        // Move to next occurrence
        startIndex = index + searchTerm.length;
      }
    });
    
    return contexts;
  }
  
  /**
   * Highlight search term in text
   * @param {string} text - The text to highlight in
   * @param {string} searchTerm - The term to highlight
   * @returns {string} - Text with highlighted search term
   */
  function highlightSearchTerm(text, searchTerm) {
    const regex = new RegExp(searchTerm, 'gi');
    return text.replace(regex, match => `<span class="search-highlight">${match}</span>`);
  }
  
  /**
   * Close the search modal
   */
  function closeSearchModal() {
    searchModal.classList.remove('active');
  }
});
