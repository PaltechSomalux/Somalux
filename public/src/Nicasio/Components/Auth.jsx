import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Tabs, 
  Tab, 
  TextField, 
  Button, 
  Box,
  Alert,
  Snackbar,
  Menu,
  MenuItem,
  ListItemIcon,
  Avatar,
  IconButton
} from '@mui/material';
import { AccountCircle, ExitToApp } from '@mui/icons-material';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import jwtDecode from 'jwt-decode'; // helps decode the token returned by Google

export const Auth = ({ 
  user, 
  setUser, 
  onLoginSuccess, 
  onLogout 
}) => {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMenuAnchor, setAuthMenuAnchor] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // ✅ Handle Google login success
  const handleGoogleLoginSuccess = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const mockUser = {
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
      };
      setUser(mockUser);
      setSnackbar({ open: true, message: 'Login successful', severity: 'success' });
      setLoginDialogOpen(false);
      if (onLoginSuccess) onLoginSuccess(mockUser);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error decoding Google token', severity: 'error' });
    }
  };

  const handleEmailLogin = () => {
    const mockUser = { name: 'John Doe', email };
    setUser(mockUser);
    setSnackbar({ open: true, message: 'Login successful', severity: 'success' });
    setLoginDialogOpen(false);
    if (onLoginSuccess) onLoginSuccess(mockUser);
  };

  const handleLogout = () => {
    setUser(null);
    setAuthMenuAnchor(null);
    setSnackbar({ open: true, message: 'Logged out successfully', severity: 'success' });
    if (onLogout) onLogout();
  };

  const renderAuthButton = () => {
    if (user) {
      return (
        <>
          <IconButton
            color="inherit"
            onClick={(e) => setAuthMenuAnchor(e.currentTarget)}
          >
            <Avatar src={user.picture} sx={{ width: 32, height: 32 }}>
              {!user.picture && (user.name ? user.name.charAt(0) : <AccountCircle />)}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={authMenuAnchor}
            open={Boolean(authMenuAnchor)}
            onClose={() => setAuthMenuAnchor(null)}
          >
            <MenuItem onClick={() => setAuthMenuAnchor(null)}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <ExitToApp fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </>
      );
    } else {
      return (
        <Button color="inherit" onClick={() => setLoginDialogOpen(true)}>
          Login
        </Button>
      );
    }
  };

  const renderLoginDialog = () => (
    <Dialog open={!user && loginDialogOpen} onClose={() => setLoginDialogOpen(false)}>
      <DialogTitle>Login to Lecture Portal</DialogTitle>
      <DialogContent>
        <Tabs value={loginMethod} onChange={(e, newValue) => setLoginMethod(newValue)}>
          <Tab label="Email" value="email" />
          <Tab label="Google" value="google" />
        </Tabs>
        {loginMethod === 'email' ? (
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />
            <Button 
              variant="contained" 
              fullWidth 
              sx={{ mt: 2 }}
              onClick={handleEmailLogin}
            >
              Login
            </Button>
          </Box>
        ) : (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={() => setSnackbar({ open: true, message: 'Login failed', severity: 'error' })}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <>
        {renderAuthButton()}
        {renderLoginDialog()}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </>
    </GoogleOAuthProvider>
  );
};
