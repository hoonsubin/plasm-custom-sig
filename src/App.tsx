import React from 'react';
import PageRoute from './routes';
import { History } from 'history';
import { ConnectedRouter } from 'connected-react-router';
import { MuiThemeProvider, CssBaseline } from '@material-ui/core';
import { createMuiTheme } from '@material-ui/core/styles';
import { blue, indigo } from '@material-ui/core/colors';
import Navbar from './components/Navbar';

const theme = createMuiTheme({
    palette: {
        secondary: {
            main: blue[900],
        },
        primary: {
            main: indigo[700],
        },
    },
    typography: {
        // Use the system font instead of the default Roboto font.
        fontFamily: ['"Lato"', 'sans-serif'].join(','),
    },
});
interface Props {
    history: History;
}
const App: React.FC<Props> = ({ history }) => {
    return (
        <ConnectedRouter history={history}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                <Navbar />
                <PageRoute />
            </MuiThemeProvider>
        </ConnectedRouter>
    );
};

export default App;
