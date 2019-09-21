import React from 'react';

import {COLORS} from '../utils.js';
import {KeypointInfo} from './keypoint.js';

/**
 * This renders the annotation details, such as the category name and keypoint visibilities.
 */
export class Annotation extends React.Component {

  constructor(props) {
      super(props);

      this.keypointVisibilityChanged = this.keypointVisibilityChanged.bind(this);
      this.changeCatRequested = this.changeCatRequested.bind(this);
      this.onCheckBoxChange = this.onCheckBoxChange.bind(this);
      this.deleteRequested = this.deleteRequested.bind(this);
      this.onMouseEnter = this.onMouseEnter.bind(this);
      this.onMouseLeave = this.onMouseLeave.bind(this);
      this.onFocus = this.onFocus.bind(this);
      this.onAnnotateNA = this.onAnnotateNA.bind(this);
      this.onHideOthers = this.onHideOthers.bind(this);
  }

  keypointVisibilityChanged(keypoint_index, visibility){

    this.props.handleKeypointVisibilityChange(this.props.id, keypoint_index, visibility);

  }

  deleteRequested(){
    this.props.handleDelete(this.props.id);
  }

  changeCatRequested(){
    this.props.handleChangeCat(this.props.category, this.props.id);
  }

  onMouseEnter(){

  }

  onMouseLeave(){

  }

  onCheckBoxChange(event){
    const target = event.target;
    const value = target.checked;
    this.props.checkBoxChange(value, this.props.id);
  }

  onFocus(){
    this.props.handleFocus(this.props.id);
  }

  onAnnotateNA(){
    this.props.handleAnnotateKeypoints(this.props.id);
  }

  onHideOthers(){
    this.props.handleHideOthers(this.props.id);
  }

  render(){
    var num_na_keypoints = 0;
    var keypointItems = [];
    for (var j=0; j < this.props.keypoints.length / 3; j++){
      let keypoint_name = this.props.category.keypoints[j];
      // console.log(keypoint_name);
      let keypoint_color = this.props.category.keypoints_style[j];

      let index = j * 3;
      let v = this.props.keypoints[index + 2];

      if (v == 0){
        num_na_keypoints += 1;
      }

      keypointItems.push((
        <KeypointInfo key={j.toString()} id={j} annotation_id={this.props.id} name={keypoint_name} visibility={v} visibilityChanged={this.keypointVisibilityChanged} color={keypoint_color}/>
      ));

    }

    let annotation_color = COLORS[this.props.id % COLORS.length];

    var na_keypoints_badge;
    if(num_na_keypoints > 0) {
      na_keypoints_badge = (<span className="badge badge-warning">{num_na_keypoints} Н/Д</span>)
    } else {
      na_keypoints_badge = (<span className="badge badge-success">{num_na_keypoints} Н/Д</span>)
    }

    // Are we hidden?
    var hiddenBadge = "";
    if(this.props.hidden){
      hiddenBadge = <span className="badge badge-secondary mr-1">Скрытый</span>;
    }

    return (
      <div className="card">
        <div className="card-header"
              role="tab" id={"annotationHeader" + this.props.id}
              onMouseEnter={this.onMouseEnter}
              onMouseLeave={this.onMouseLeave}>
          <div className="d-flex justify-content-between">
            <div className="p-2" data-toggle="collapse" data-parent="#annotationAccordion"
              href={"#annotationBody" + this.props.id} style={{cursor : "pointer"}}>
              <span className="badge px-2 mr-1" style={{backgroundColor: annotation_color}}></span>
              <span>{this.props.category.name}</span>
            </div>
            <div className="hard-situation">
              hard
              <input type="checkbox" checked={this.props.is_hard} onChange={this.onCheckBoxChange} />
            </div>
            <div className="p-2">
              {na_keypoints_badge}
            </div>
            <div className="p-2">
              <div className="btn-group" role="group">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={this.onFocus}>Фокус</button>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={this.onAnnotateNA}>Аннотировать Н/Д</button>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={this.onHideOthers}>Скрыть остальные</button>
              </div>
            </div>
            <div className="p-2">
              {hiddenBadge}
              <button type="button" className="btn btn-sm btn-primary" onClick={this.changeCatRequested}>Изменить категорию</button>
              <button type="button" className="btn btn-sm btn-danger" onClick={this.deleteRequested}>Удалить</button>
            </div>
          </div>
        </div>
        <div className="collapse" role="tabpanel" id={"annotationBody" + this.props.id}>
          <div className="card-block">
            <div className="row">
              <div className="col">
                <table className="table table-striped table-sm">
                  <thead>
                    <tr>
                        <th className="w-50"></th>
                        <th className="w-15">н/д</th>
                        <th className="w-15">закрытый</th>
                        <th className="w-15">видимый</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keypointItems}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}