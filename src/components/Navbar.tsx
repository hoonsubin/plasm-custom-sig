import { AppBar, makeStyles, Toolbar, Typography } from '@material-ui/core';
import React from 'react';

const useStyles = makeStyles(() => ({
    appBar: {
        position: 'relative',
        width: '100%',
    },
}));

const Navbar: React.FC = () => {
    const classes = useStyles();
    return (
        <>
            <AppBar position="absolute" color="default" className={classes.appBar}>
                <Toolbar>
                    <Typography variant="h6" color="inherit" noWrap>
                        React Application
                    </Typography>
                </Toolbar>
            </AppBar>
        </>
    );
};

export default Navbar;
