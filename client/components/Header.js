import React from 'react'
import { Container, Row, Col, Button, Dropdown, DropdownButton, ButtonGroup } from 'react-bootstrap'

import { Flow } from "../components/Layout"
import { shortenAccount, getAccount, networkInfo } from "../web3/utils"
import { myWeb3 } from "../web3/provider"
import { getBalance as getBalancePoolLP, getAllowance as getAllowancePoolLP } from "../web3/pool_lp"
import { getBalance as getBalanceUSDC, getAllowance as getAllowanceUSDC } from "../web3/usdc"


export default class Header extends React.Component {

    constructor(props) {
        super(props);
        this.state = {}
        this.handleAccount = this.handleAccount.bind(this);
    }

    componentDidMount() {
        this.reload()

        ethereum.on('chainChanged', (chainId) => {
            // Handle the new chain.
            // Correctly handling chain changes can be complicated.
            // We recommend reloading the page unless you have good reason not to.
            console.log("chainId changed:", chainId)

            window.location.reload();
        });
    }

    reloadPressed = async () => {
        this.reload()
        this.props.reload()  // reaload parent page
    }

    reload = async () => {
        await this.loadNetworkInfo()
        await this.loadAccount()
        await this.loadBalance()
    }


    connect = () => {
        ethereum.request({ method: 'eth_requestAccounts' }).then(accounts => {
            let account = accounts.length > 0? accounts[0] : undefined
            if (account) {
                this.reload()
                this.handleAccount(account)
            } else {
                console.log(">>> connect() - account ", account)
            }
        })
    }

    handleAccount = (account) => {
        if (account) {
            this.setState({
                account: shortenAccount(account),
            })
            this.props.setAccountConnected({
                account: account,
                networkId: this.state.networkId,
                networkName: this.state.networkName,
            })
        } else {
            this.setState({
                account: undefined,
            })
            this.props.setAccountConnected({
                account: undefined,
                networkId: this.state.networkId,
                networkName: this.state.networkName,
            })
        }
    }


    loadAccount = () => {
        getAccount().then((account) => {
            this.handleAccount(account)
        }).catch(error => {
            this.setState({ error: error.message })
            this.props.setAccountConnected({
                account: undefined,
                networkId: this.state.networkId,
                networkName: this.state.networkName,
            })
        })
    }

    loadBalance = () => {
        getBalanceUSDC().then(data => {
            this.setState({
                balanceUSDC: data.units
            })
            return getBalancePoolLP()
        }).then(data => {
            this.setState({
                balancePoolLP: data.units
            })
        }).catch(error => {
            this.setState({ error: error.message })
        })
    }


    loadNetworkInfo = () => {

        networkInfo().then( info => {
            console.log("loadNetworkInfo", info)
            this.setState({
                networkId: info.networkId,
                networkName: info.networkName,
                blockNumber: info.blockNumber,
                blockTimestamp: info.blockTimestamp,
            })
        }).catch((error) => {
            this.setState({ error: error.message })
        })
    }



    render() {

        const { balanceUSDC, balancePoolLP, blockNumber, networkId, networkName } = this.state
        const blockDate = this.state && this.state.blockTimestamp && new Date(this.state.blockTimestamp * 1000)
        const blockDateFormatted = (blockDate && `${blockDate.toLocaleDateString()} @ ${blockDate.toLocaleTimeString()}`) || "-"
        const account = this.state && this.state.account

        return (
            <div className="header">
                <Container fluid>
                    <Row>
                        <Col>
                            <Flow>
                                <div>
                                    Connected to <span>{networkName}</span>
                                </div>
                  
                                <div> 
                                    <span className="m-2" > {balanceUSDC || 0} USDC</span> 
                                    <span className="m-2"> {balancePoolLP || 0} Pool-LP </span> 
                                </div>
                            </Flow>
                        </Col>

                        <Col xs className="text-end">
                            {(account &&
                                <DropdownButton
                                    id="menu"
                                    variant="outline-primary"
                                    title={account}
                                >
                                    <Dropdown.Item eventKey="1" disabled >Block Info</Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item eventKey="2" disabled >number: {blockNumber} </Dropdown.Item>
                                    <Dropdown.Item eventKey="3" disabled >date: {blockDateFormatted}</Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item eventKey="4" onClick={() => this.reloadPressed()}>Reload</Dropdown.Item>
                                </DropdownButton>
                            ) || <Button name="connect" variant="primary" onClick={() => this.connect()} >Connect Wallet</Button>}
                        </Col>
                    </Row>
                </Container>

            </div>
        )
    }
}