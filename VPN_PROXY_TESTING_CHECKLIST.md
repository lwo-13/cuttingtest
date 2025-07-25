# VPN Proxy Testing Checklist

## Pre-Deployment Testing

### 1. Local Environment Verification
- [ ] `npm run start:local` works correctly
- [ ] All API calls function properly
- [ ] Login/logout works
- [ ] All routes are accessible

### 2. VM Environment Verification  
- [ ] `npm run start:vm` works correctly
- [ ] Direct VM access functions properly
- [ ] No CORS errors in browser console

### 3. Build Process Verification
- [ ] `npm run build:vpn` completes successfully
- [ ] Built files contain correct proxy paths
- [ ] No build errors or warnings

## Post-Deployment Testing

### 4. Frontend Access Testing
- [ ] Access `https://sslvpn1.calzedonia.com/web_forward_CuttingApplication/`
- [ ] Application loads without errors
- [ ] All static assets load correctly (CSS, JS, images)
- [ ] No 404 errors in browser console
- [ ] React Router navigation works with proxy paths

### 5. Authentication Testing
- [ ] Login page loads correctly
- [ ] Login functionality works
- [ ] JWT token is stored properly
- [ ] Logout functionality works
- [ ] Session persistence works across page refreshes

### 6. API Connectivity Testing
- [ ] API calls are made to correct proxy URL
- [ ] No CORS errors in browser console
- [ ] All major endpoints respond correctly:
  - [ ] `/mattress/all_with_details`
  - [ ] `/orders/order_lines`
  - [ ] `/markers/marker_headers_planning`
  - [ ] `/operators/active`
  - [ ] `/navision/width_validation`

### 7. Core Functionality Testing
- [ ] Dashboard loads with data
- [ ] Order planning functionality works
- [ ] Mattress management works
- [ ] Print functionality works
- [ ] Kanban board loads and functions
- [ ] Spreader view works
- [ ] Cutter view works
- [ ] Subcontractor view works

### 8. Navigation Testing
- [ ] All menu items work correctly
- [ ] Breadcrumb navigation works
- [ ] Direct URL access works for all routes
- [ ] Browser back/forward buttons work
- [ ] Role-based routing works correctly

### 9. Performance Testing
- [ ] Initial page load time is acceptable
- [ ] API response times are reasonable
- [ ] No memory leaks or performance issues
- [ ] Large data sets load properly

### 10. Error Handling Testing
- [ ] Network errors are handled gracefully
- [ ] API errors display appropriate messages
- [ ] 404 pages work correctly
- [ ] Unauthorized access is handled properly

## Browser Compatibility Testing

### 11. Cross-Browser Testing
- [ ] Chrome - Latest version
- [ ] Firefox - Latest version  
- [ ] Edge - Latest version
- [ ] Safari - Latest version (if applicable)

### 12. Mobile Responsiveness
- [ ] Application works on mobile devices
- [ ] Touch interactions work properly
- [ ] Responsive design functions correctly

## Security Testing

### 13. CORS Verification
- [ ] Only allowed origins can access API
- [ ] Preflight requests work correctly
- [ ] Credentials are handled properly

### 14. HTTPS Verification
- [ ] All communication uses HTTPS
- [ ] No mixed content warnings
- [ ] SSL certificate is valid

## Monitoring and Logging

### 15. Error Monitoring
- [ ] Check browser console for JavaScript errors
- [ ] Check network tab for failed requests
- [ ] Monitor Flask API logs for errors
- [ ] Check server access logs

### 16. Performance Monitoring
- [ ] Monitor API response times
- [ ] Check for memory usage issues
- [ ] Monitor network bandwidth usage

## Rollback Testing

### 17. Rollback Verification
- [ ] Rollback to direct VM access works
- [ ] Previous configuration can be restored quickly
- [ ] No data loss during rollback

## Documentation Verification

### 18. Documentation Check
- [ ] All configuration changes are documented
- [ ] Deployment instructions are clear and accurate
- [ ] Troubleshooting guide is complete
- [ ] Contact information is up to date

## Sign-off

### 19. Stakeholder Approval
- [ ] Technical team approval
- [ ] Network administrator approval
- [ ] End user acceptance testing
- [ ] Management sign-off

## Common Issues to Watch For

### Frontend Issues
- Routes returning 404 due to incorrect basename
- Static assets not loading due to path issues
- JavaScript errors due to environment differences

### API Issues
- CORS errors due to incorrect origin configuration
- API calls failing due to incorrect proxy paths
- Authentication issues due to cookie/session problems

### Network Issues
- Proxy configuration problems
- SSL certificate issues
- Firewall blocking requests

### Performance Issues
- Slow loading due to proxy overhead
- Timeout issues with long-running requests
- Caching problems with proxy setup

## Emergency Contacts

- **Network Administrator**: [Contact Info]
- **Technical Lead**: [Contact Info]
- **System Administrator**: [Contact Info]

## Testing Notes

Date: ___________
Tester: ___________
Environment: ___________
Issues Found: ___________
Resolution: ___________
