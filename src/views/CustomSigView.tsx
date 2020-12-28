import React, { useState } from 'react';
import * as utils from '../utils';
import * as polkadotUtilCrypto from '@polkadot/util-crypto';
import { makeStyles } from '@material-ui/core/styles';
import { Container, Typography, Button } from '@material-ui/core';

const useStyles = makeStyles(() => ({
    root: {
        marginTop: 10,
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    title: {
        textAlign: 'center',
    },
}));

const CustomSigView: React.FC = () => {
    const classes = useStyles();
    const [ethAccount, setEthAccount] = useState<string>();
    const [plasmAddr, setPlasmAddr] = useState<string>();
    const [isLoading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string>();

    const [recipient, setRecipient] = useState<string>();
    const [sendVal, setSendVal] = useState('0');

    const handleConnection = () => {
        setLoading(true);
        if (errorMsg) setErrorMsg(undefined);
        utils
            .getEthereumRpc()
            .then((res) => {
                setEthAccount(res.account);
                utils
                    .getAccountPubKeyRpc(res.account)
                    .then((i) => {
                        const _plasmAddr = utils.ecdsaPubKeyToPlasmAddress(i, utils.NETWORK_PREFIX);
                        setPlasmAddr(_plasmAddr);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            })
            .catch((err) => {
                setErrorMsg(err.message);
            });
    };

    const handleTxButton = () => {
        if (!recipient || !plasmAddr) return;

        const isValid =
            polkadotUtilCrypto.checkAddress(recipient, utils.NETWORK_PREFIX) &&
            polkadotUtilCrypto.checkAddress(plasmAddr, utils.NETWORK_PREFIX);

        if (isValid[0]) {
            setLoading(true);
            if (errorMsg) setErrorMsg(undefined);
            utils
                .sendCustomTransfer(recipient, plasmAddr, sendVal)
                .then((i) => {
                    console.log('made transaction hash' + i.toHex());
                })
                .catch((e) => {
                    setErrorMsg(e.message);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            const err = isValid[1] || undefined;
            setErrorMsg(err);
            throw new Error(err);
        }
    };

    return (
        <main className={classes.root}>
            <Container maxWidth="md">
                <Typography variant="h1" component="h2" className={classes.title}>
                    Plasm Custom Signature
                </Typography>
                {ethAccount && plasmAddr && (
                    <>
                        <h2>Ethereum Account: {ethAccount}</h2>
                        <h2>Plasm Account: {plasmAddr}</h2>
                        <div>
                            <h1>Send Balance</h1>
                            <h2>Send to:</h2>
                            <input value={recipient} onChange={(e) => setRecipient(e.target.value)}></input>
                            <h2>Send amount:</h2>
                            <input value={sendVal} onChange={(e) => setSendVal(e.target.value)}></input>
                            <Button variant="outlined" onClick={handleTxButton}>
                                Send Transaction
                            </Button>
                        </div>
                    </>
                )}
                {isLoading ? (
                    <h3>Loading...</h3>
                ) : (
                    !plasmAddr && (
                        <Button variant="outlined" onClick={handleConnection}>
                            Connect To MetaMask
                        </Button>
                    )
                )}

                {errorMsg && <p>Error: {errorMsg}</p>}
            </Container>
        </main>
    );
};

export default CustomSigView;
