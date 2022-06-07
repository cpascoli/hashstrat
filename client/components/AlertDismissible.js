import React, { useState } from 'react'
import { Alert, Button } from 'react-bootstrap'

export const AlertDismissible = ( props ) => {

    console.log("AlertDismissible props: ", props)

    const buttonTitle = props.buttonTitle || "Close"

    return (
      <>
        <Alert show={ props.show } variant={props.variant}>
          <Alert.Heading>{props.title} </Alert.Heading>
          <p> {props.children} </p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button onClick={() => props.buttonAction() } variant={`outline-${props.variant}`}>
              {buttonTitle}
            </Button>
          </div>
        </Alert>

      </>
    );
  }
  
  export default AlertDismissible;