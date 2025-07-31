import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import InfoIcon from '@mui/icons-material/Info';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  IconButton,
  Tooltip,
  Popover,
  Typography,
  TextField,
  Autocomplete
} from '@mui/material';
import { setMessageToastForAdminConsole } from "../../redux/reducers/appReducer";
import fnServiceRequest from "../../utility/fnServiceRequest";

const DmsCleanup = () => {
  const dispatch = useDispatch();

  const [dmsCleanupDialog, setDmsCleanupDialog] = useState(false);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [remarks, setRemarks] = useState('');
  const [confirmationAnchor, setConfirmationAnchor] = useState(null);
  const [isDmsDeleting, setIsDmsDeleting] = useState(false);
  const [countries, setCountries] = useState([]);
  const [belowSixMonthDialog, setBelowSixMonthDialog] = useState(false);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [deleteResponse, setDeleteResponse] = useState(null);
  const [sixMonthRange, setSixMonthRange] = useState({
    above: false,
    below: true
  });
  const [deletedStatus, setDeletedStatus] = useState(false);
  const [showUnderReviewIds, setShowUnderReviewIds] = useState(false);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => ({
    value: currentYear - i,
    label: (currentYear - i).toString()
  }));

  // const [conditionalDMSDelete, setConditionalDMSDelete] = useState({
  //   belowSixMonth: false,
  //   aboveSixMonth: false
  // })

  const handleDmsCleanup = () => {
    setDmsCleanupDialog(true);
  };

  const handleDmsCleanupClose = () => {
    setDmsCleanupDialog(false);
    setSelectedYear(null);
    setSelectedMonth(null);
    setSelectedCountry(null);
    setRemarks('');
    setDeletedStatus(false);
    setDeleteResponse(null);
    setShowUnderReviewIds(false);
  };

  const handleDeleteConfirmation = (event) => {
    if (!selectedYear || !selectedMonth || !selectedCountry) {
      dispatch(
        setMessageToastForAdminConsole({
          visiblity: true,
          message: "Please select year, month, and country",
          type: "warning"
        })
      );
      return;
    }
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const diff = (currentYear - selectedYear?.value) * 12 + (currentMonth - selectedMonth?.value);
    if (diff > 6) {
      setSixMonthRange({
        below: false, above: true
      })
    } else {
      setSixMonthRange({
        above: false, below: true
      })
    }
    setConfirmationAnchor(event.currentTarget);
  };

  const handleConfirmDelete = async () => {
    const formattedMonth = String(selectedMonth?.value).padStart(2, '0');
    const dmsURL = `/RustoleumJavaServices_Oauth/api/v1/deleteFoldersByMonth`;
    
    setIsDmsDeleting(true);

    try {
      fnServiceRequest(
        dmsURL,
        "POST",
        (response) => {
          if (response?.underReviewOrderIds && response?.underReviewOrderIds.length > 0) {
            console.log("underReviewOrderIds", response?.underReviewOrderIds);
            setDeleteResponse(response);
          }
          setDeletedStatus(true);
          console.log("response", response);

          dispatch(
            setMessageToastForAdminConsole({
              visiblity: true,
              message: `DMS data for ${selectedMonth?.label} ${selectedYear?.label} in ${selectedCountry?.countryName} deleted successfully`,
              type: "success"
            })
          );
        },
        (error) => {
          console.warn("Error", error);
          dispatch(
            setMessageToastForAdminConsole({
              visiblity: true,
              message: "Error deleting DMS data. Please try again.",
              type: "error"
            })
          );
          setDeletedStatus(false);
        },
        {
          country: selectedCountry?.countryCode,
          year: selectedYear?.label,
          month: formattedMonth,
          remark: remarks
        }
      );

      dispatch(
        setMessageToastForAdminConsole({
          visiblity: true,
          message: "Deleting DMS data...",
          type: "info"
        })
      );

    } catch (error) {
      console.error("Error deleting DMS data:", error);
      dispatch(
        setMessageToastForAdminConsole({
          visiblity: true,
          message: "Error deleting DMS data. Please try again.",
          type: "error"
        })
      );
      setDeletedStatus(false);
    } finally {
      setIsDmsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setConfirmationAnchor(null);
    setDeletedStatus(false);
    setDeleteResponse(null);
    setShowUnderReviewIds(false);
  };

  const handleClosePopover = () => {
    setConfirmationAnchor(null);
    setDeletedStatus(false);
    setDeleteResponse(null);
    setShowUnderReviewIds(false);
    // Reset form
    setSelectedYear(null);
    setSelectedMonth(null);
    setSelectedCountry(null);
    setRemarks('');
    setDmsCleanupDialog(false);
  };

  const handleInfoIconClick = () => {
    setShowUnderReviewIds(!showUnderReviewIds);
  };

  const fetchCountries = async () => {
    const sFetchUrl = `/RustoleumJavaServices_Oauth/api/v1/scheduler/getCountry`;
    fnServiceRequest(
      sFetchUrl,
      "GET",
      (response) => {
        console.log("responce", response);

        if (response && response.length > 0) {
          setCountries(response);
        }
      },
      (error) => {
        console.error("Error fetching countries:", error);
      }
    );
  };

  function getAvailableMonths(selectedYear) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 0-based, so add 1
    console.log("months", months);
    const tempMonths = [...months];
    if (selectedYear < currentYear) {
      return tempMonths
    }
    else if (selectedYear === currentYear) {
      return tempMonths.filter(month => month.value <= currentMonth); // only previous months
    } else {
      return [];
    }
  }

  useEffect(() => {
    const aMonths = getAvailableMonths(selectedYear?.value);
    setAvailableMonths(aMonths)
  }, [selectedYear])

  useEffect(() => {
    fetchCountries();
  }, [])

  return (
    <>
      {/* DMS Cleanup Icon Button */}
      <Tooltip title="DMS Clean Up">
        <IconButton
          onClick={handleDmsCleanup}
          disabled={isDmsDeleting}
          style={{
            backgroundColor: isDmsDeleting ? '#ccc' : '#DB0034',
            color: 'black',
            width: '40px',
            height: '40px'
          }}
        >
          <DeleteSweepIcon />
        </IconButton>
      </Tooltip>

      {/* DMS Cleanup Dialog */}
      <Dialog
        open={dmsCleanupDialog}
        onClose={handleDmsCleanupClose}
        PaperProps={{
          style: {
            width: '500px',
            height: '450px',
            maxWidth: 'none',
            maxHeight: 'none',
            borderRadius: '12px',
            padding: '8px'
          }
        }}
      >
        <DialogTitle style={{
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '1.5rem',
          color: '#333',
          paddingBottom: '10px'
        }}>
          DMS Clean Up
        </DialogTitle>
        <DialogContent
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            height: '100%',
            paddingTop: '20px',
            overflowX: 'hidden',
            overflowY: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              width: '100%',
              maxWidth: '400px'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '15px',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ flex: '1 1 100%' }}>
                <Autocomplete
                  options={countries}
                  getOptionLabel={(option) => option?.countryName || ''}
                  value={selectedCountry}
                  onChange={(e, newValue) => setSelectedCountry(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="*Select Country"
                      fullWidth
                      variant="outlined"
                      InputProps={{ ...params.InputProps, style: { borderRadius: '8px' } }}
                      InputLabelProps={{ style: { fontWeight: '500' } }}
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option?.countryCode === value?.countryCode}
                />
              </div>

              <div style={{ flex: '1 1 45%' }}>
                <Autocomplete
                  options={years}
                  getOptionLabel={(option) => option?.label || ''}
                  value={selectedYear}
                  onChange={(e, newValue) => setSelectedYear(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="*Select Year"
                      fullWidth
                      variant="outlined"
                      InputProps={{ ...params.InputProps, style: { borderRadius: '8px' } }}
                      InputLabelProps={{ style: { fontWeight: '500' } }}
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option?.value === value?.value}
                />
              </div>

              <div style={{ flex: '1 1 45%' }}>
                <Autocomplete
                  options={availableMonths}
                  getOptionLabel={(option) => option?.label || ''}
                  value={selectedMonth}
                  onChange={(e, newValue) => setSelectedMonth(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="*Select Month"
                      fullWidth
                      variant="outlined"
                      InputProps={{ ...params.InputProps, style: { borderRadius: '8px' } }}
                      InputLabelProps={{ style: { fontWeight: '500' } }}
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option?.value === value?.value}
                />
              </div>
            </div>

            <TextField
              fullWidth
              label="*Remarks"
              multiline
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              variant="outlined"
              placeholder="Enter any additional remarks..."
              InputProps={{ style: { borderRadius: '8px' } }}
              InputLabelProps={{ style: { fontWeight: '500' } }}
            />
          </div>
        </DialogContent>

        <DialogActions style={{
          padding: '20px 30px 25px',
          justifyContent: 'space-between',
          gap: '15px'
        }}>
          <Button
            onClick={handleDmsCleanupClose}
            color="secondary"
            variant="outlined"
            style={{
              minWidth: '100px',
              height: '45px',
              borderRadius: '8px',
              fontWeight: '500',
              textTransform: 'none',
              color: "#DB0034",
              borderColor: "#DB0034"
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirmation}
            color="error"
            variant="contained"
            disabled={!selectedYear || !selectedMonth || !selectedCountry || isDmsDeleting || !remarks}
            sx={{
              minWidth: '100px',
              height: '45px',
              borderRadius: '8px',
              fontWeight: '500',
              textTransform: 'none !important',
              backgroundColor: !selectedYear || !selectedMonth || !selectedCountry || isDmsDeleting ? '#ccc' : '#DB0034'
            }}
          >
            {isDmsDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Popover */}
      <Popover
        open={Boolean(confirmationAnchor)}
        anchorEl={dmsCleanupDialog ? document.querySelector('[role="dialog"]') : confirmationAnchor}
        onClose={handleCancelDelete}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'center',
        }}
      >
        <div style={{ padding: '20px', maxWidth: '400px', minWidth: '300px' }}>
          {!deletedStatus ? (
            <>
              <Typography variant="h6" gutterBottom>
                {sixMonthRange?.above === false ? "" : "Confirm Delete"}
              </Typography>
              <Typography variant="body2" gutterBottom>
                {sixMonthRange?.above === false ? (
                  <p
                    style={{
                      color: '#b00020',
                      fontWeight: 'bold',
                      fontSize: '15px',
                      padding: '16px',
                      border: '2px solid red',
                      borderRadius: '8px',
                      fontFamily: 'Segoe UI, Tahoma, sans-serif',
                      textAlign: 'center',
                      letterSpacing: '1px'
                    }}
                  >
                    ⚠️ WARNING: <br />
                    Are you sure you want to <strong>delete DMS data from the last 6 months</strong>?
                  </p>
                ) : (
                  <>
                    Are you sure you want to delete DMS data for {selectedMonth?.label} {selectedYear?.label} in {selectedCountry?.countryName}?
                    {remarks && (
                      <><br /><strong>Remarks:</strong> {remarks}</>
                    )}
                  </>
                )}
              </Typography>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
                <Button
                  sx={{
                    minWidth: '100px',
                    height: '45px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    textTransform: 'none !important',
                    borderColor: '#DB0034',
                    color: '#DB0034',
                    '&:hover': {
                      color: '#DB0034',
                      backgroundColor: 'white',
                      borderColor: '#DB0034'
                    }
                  }}
                  variant="outlined" 
                  onClick={handleCancelDelete} 
                  size="small"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  variant="outlined"
                  size="small"
                  disabled={isDmsDeleting}
                  sx={{
                    minWidth: '100px',
                    height: '45px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    textTransform: 'none !important',
                    backgroundColor: '#DB0034',
                    borderColor: '#DB0034',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#b00020',
                      color: 'white',
                      borderColor: '#DB0034'
                    }
                  }}
                >
                  {isDmsDeleting ? "Deleting..." : "Confirm"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <Typography variant="h6" style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                  ✅ Delete Successful
                </Typography>
                {deleteResponse?.underReviewOrderIds && deleteResponse.underReviewOrderIds.length > 0 && (
                  <Tooltip title="Click to view under review order IDs">
                    <IconButton 
                      onClick={handleInfoIconClick}
                      size="small"
                      style={{ color: '#2196F3' }}
                    >
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </div>
              
              <Typography variant="body2" gutterBottom style={{ color: '#333', marginBottom: '15px' }}>
                DMS data for <strong>{selectedMonth?.label} {selectedYear?.label}</strong> in <strong>{selectedCountry?.countryName}</strong> has been successfully deleted.
              </Typography>

              {showUnderReviewIds && deleteResponse?.underReviewOrderIds && deleteResponse.underReviewOrderIds.length > 0 && (
                <div style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  marginBottom: '15px',
                  border: '1px solid #ddd'
                }}>
                  <Typography variant="body2" style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                    Under Review Order IDs:
                  </Typography>
                  <Typography variant="body2" style={{ 
                    wordBreak: 'break-all', 
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    backgroundColor: 'white',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }}>
                    {deleteResponse.underReviewOrderIds.join(', ')}
                  </Typography>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
                <Button
                  onClick={handleClosePopover}
                  variant="contained"
                  sx={{
                    minWidth: '100px',
                    height: '45px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    textTransform: 'none !important',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#45a049'
                    }
                  }}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </Popover>
    </>
  );
};

export default DmsCleanup;